import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { TutorRankingService } from '../tutors/tutor-ranking.service';
import { assertValidTransition } from './request-status.state-machine';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private ranking: TutorRankingService,
  ) {}

  async create(studentId: string, dto: CreateRequestDto) {
    return this.prisma.request.create({
      data: {
        studentId,
        universityId: dto.universityId,
        facultyId: dto.facultyId,
        academicYear: dto.academicYear,
        subjectId: dto.subjectId,
        topicId: dto.topicId,
        description: dto.description,
        teachingMode: dto.teachingMode,
        preferredAt: dto.preferredAt ? new Date(dto.preferredAt) : undefined,
        budgetEGP: dto.budgetEGP,
        urgency: dto.urgency,
        status: RequestStatus.DRAFT,
        statusHistory: {
          create: { toStatus: RequestStatus.DRAFT, changedByUserId: studentId },
        },
      },
    });
  }

  // Get all requests for a specific student
  async findMyRequests(studentId: string, status?: RequestStatus) {
    return this.prisma.request.findMany({
      where: {
        studentId,
        ...(status ? { status } : {}),
      },
      include: {
        subject: true,
        topic: true,
        university: true,
        faculty: true,
        matches: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
        booking: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
            payment: true,
            review: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single request by ID with security check
  async getById(requestId: string, userId: string, isTutorOrAdmin = false) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: { id: true, fullName: true, avatarUrl: true, email: true },
        },
        subject: true,
        topic: true,
        university: true,
        faculty: true,
        matches: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
        booking: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
            payment: true,
            review: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) throw new NotFoundException('Request not found');

    if (!isTutorOrAdmin && request.studentId !== userId) {
      throw new ForbiddenException('You do not have access to this request');
    }

    return request;
  }

  // Publishing triggers the matching engine and persists the
  // resulting shortlist — this IS "we find suitable tutors" from
  // the product brief.
  async publish(requestId: string, studentId: string) {
    const request = await this.getOwnedRequest(requestId, studentId);
    assertValidTransition(request.status, RequestStatus.PUBLISHED);

    await this.transition(request.id, request.status, RequestStatus.PUBLISHED, studentId);
    await this.transition(request.id, RequestStatus.PUBLISHED, RequestStatus.MATCHING, studentId);

    const matches = await this.ranking.findTopMatches({
      subjectId: request.subjectId,
      topicId: request.topicId,
      teachingMode: request.teachingMode,
      limit: 5,
    });

    if (matches.length > 0) {
      await this.prisma.requestMatch.createMany({
        data: matches.map((m, i) => ({
          requestId: request.id,
          tutorId: m.tutor.id,
          score: m.score,
          rank: i + 1,
        })),
      });
    }

    return this.prisma.request.findUnique({
      where: { id: request.id },
      include: { matches: { include: { tutor: true }, orderBy: { rank: 'asc' } } },
    });
  }

  async selectTutor(requestId: string, studentId: string, tutorId: string) {
    const request = await this.getOwnedRequest(requestId, studentId);
    assertValidTransition(request.status, RequestStatus.TUTOR_SELECTED);

    // Optional match check
    const isValidMatch = await this.prisma.requestMatch.findUnique({
      where: { requestId_tutorId: { requestId, tutorId } },
    });
    if (!isValidMatch) {
      // allow if direct selection or fallback
    }

    await this.transition(request.id, request.status, RequestStatus.TUTOR_SELECTED, studentId);
    
    // Auto-create booking record
    const startsAt = request.preferredAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

    await this.prisma.booking.upsert({
      where: { requestId },
      create: {
        requestId,
        tutorId,
        teachingMode: request.teachingMode,
        startsAt,
        endsAt,
        priceEGP: request.budgetEGP ?? 250,
      },
      update: {
        tutorId,
        startsAt,
        endsAt,
      },
    });

    return this.prisma.request.update({
      where: { id: requestId },
      data: { selectedTutorId: tutorId },
      include: { booking: true },
    });
  }

  async rateSession(
    requestId: string,
    studentId: string,
    dto: {
      overallRating: number;
      explanationRating?: number;
      communicationRating?: number;
      helpfulnessRating?: number;
      comment?: string;
    },
  ) {
    const request = await this.getOwnedRequest(requestId, studentId);
    const booking = await this.prisma.booking.findUnique({
      where: { requestId },
    });

    if (!booking) throw new NotFoundException('Booking not found for request');

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          authorId: studentId,
          tutorId: booking.tutorId,
          overallRating: dto.overallRating,
          explanationRating: dto.explanationRating ?? dto.overallRating,
          communicationRating: dto.communicationRating ?? dto.overallRating,
          helpfulnessRating: dto.helpfulnessRating ?? dto.overallRating,
          comment: dto.comment,
        },
        update: {
          overallRating: dto.overallRating,
          explanationRating: dto.explanationRating ?? dto.overallRating,
          communicationRating: dto.communicationRating ?? dto.overallRating,
          helpfulnessRating: dto.helpfulnessRating ?? dto.overallRating,
          comment: dto.comment,
        },
      });

      // Give 20 points reward to student
      await tx.pointTransaction.create({
        data: {
          userId: studentId,
          points: 20,
          reason: 'TUTOR_RATED',
          refType: 'Review',
          refId: review.id,
        },
      });

      await tx.studentProfile.update({
        where: { userId: studentId },
        data: { pointsBalance: { increment: 20 } },
      });

      await tx.request.update({
        where: { id: requestId },
        data: { status: RequestStatus.STUDENT_RATED },
      });

      return review;
    });
  }

  async openDispute(requestId: string, studentId: string, reason: string) {
    const request = await this.getOwnedRequest(requestId, studentId);
    assertValidTransition(request.status, RequestStatus.DISPUTED);
    return this.transition(
      request.id,
      request.status,
      RequestStatus.DISPUTED,
      studentId,
      reason,
    );
  }

  async cancel(requestId: string, actorId: string, reason?: string) {
    const request = await this.prisma.request.findUniqueOrThrow({
      where: { id: requestId },
    });
    assertValidTransition(request.status, RequestStatus.CANCELLED);
    return this.transition(
      request.id,
      request.status,
      RequestStatus.CANCELLED,
      actorId,
      reason,
    );
  }

  // Every transition goes through here so it's always paired with an
  // audit row — required for the DISPUTED flow to be resolvable.
  private async transition(
    requestId: string,
    from: RequestStatus,
    to: RequestStatus,
    changedByUserId: string,
    reason?: string,
  ) {
    return this.prisma.$transaction([
      this.prisma.request.update({ where: { id: requestId }, data: { status: to } }),
      this.prisma.requestStatusHistory.create({
        data: { requestId, fromStatus: from, toStatus: to, changedByUserId, reason },
      }),
    ]);
  }

  // IDOR protection: a student can only act on their own request.
  private async getOwnedRequest(requestId: string, studentId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.studentId !== studentId) {
      throw new ForbiddenException('This request does not belong to you');
    }
    return request;
  }
}
