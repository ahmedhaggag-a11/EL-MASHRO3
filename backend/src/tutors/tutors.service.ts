import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RequestStatus,
  TeachingMode,
  TutorApplicationStatus,
} from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { SettingsService } from '../admin/settings.service';

@Injectable()
export class TutorsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  // ------------------------------------------------------------
  // 1. TEACHER APPLICATION
  // ------------------------------------------------------------
  async submitApplication(
    userId: string,
    dto: {
      universityName: string;
      facultyName: string;
      departmentName?: string;
      experienceSummary?: string;
      introVideoUrl?: string;
      preferredMode?: TeachingMode;
    },
  ) {
    const existing = await this.prisma.tutorApplication.findFirst({
      where: {
        userId,
        status: {
          in: [
            TutorApplicationStatus.PENDING,
            TutorApplicationStatus.UNDER_REVIEW,
            TutorApplicationStatus.ACCEPTED,
          ],
        },
      },
    });

    if (existing) {
      if (existing.status === TutorApplicationStatus.ACCEPTED) {
        throw new ConflictException('You are already an accepted tutor');
      }
      throw new ConflictException(
        'You already have an active application under review',
      );
    }

    return this.prisma.tutorApplication.create({
      data: {
        userId,
        universityName: dto.universityName,
        facultyName: dto.facultyName,
        departmentName: dto.departmentName,
        experienceSummary: dto.experienceSummary,
        introVideoUrl: dto.introVideoUrl,
        preferredMode: dto.preferredMode ?? TeachingMode.BOTH,
        status: TutorApplicationStatus.PENDING,
      },
    });
  }

  async getMyApplication(userId: string) {
    return this.prisma.tutorApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ------------------------------------------------------------
  // 2. TUTOR LEADS (OPEN REQUESTS MATCHING TUTOR)
  // ------------------------------------------------------------
  async getLeadsForTutor(userId: string) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: { subjects: true, topics: true },
    });

    // Fetch requests that are either MATCHING or PUBLISHED
    return this.prisma.request.findMany({
      where: {
        status: { in: [RequestStatus.PUBLISHED, RequestStatus.MATCHING] },
      },
      include: {
        student: { select: { fullName: true, avatarUrl: true } },
        subject: true,
        topic: true,
        university: true,
        faculty: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ------------------------------------------------------------
  // 3. TUTOR BOOKINGS & SCHEDULE
  // ------------------------------------------------------------
  async getMyBookings(userId: string) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!tutorProfile) return [];

    return this.prisma.booking.findMany({
      where: { tutorId: tutorProfile.id },
      include: {
        request: {
          include: {
            student: {
              select: { fullName: true, email: true, phone: true },
            },
            subject: true,
            topic: true,
          },
        },
        payment: true,
        review: true,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  // ------------------------------------------------------------
  // 4. EARNINGS & REVIEWS
  // ------------------------------------------------------------
  async getEarningsSummary(userId: string) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        bookings: {
          include: { payment: true },
        },
      },
    });

    if (!tutorProfile) {
      return {
        totalEarnings: 0,
        clearedEarnings: 0,
        pendingEarnings: 0,
        platformFees: 0,
        completedSessions: 0,
      };
    }

    let clearedEarnings = 0;
    let pendingEarnings = 0;
    let platformFees = 0;

    for (const b of tutorProfile.bookings) {
      if (b.payment) {
        if (b.payment.status === 'PAID') {
          clearedEarnings += b.payment.tutorEarningsEGP;
          platformFees += b.payment.platformFeeEGP;
        } else {
          pendingEarnings += b.payment.tutorEarningsEGP;
        }
      }
    }

    return {
      totalEarnings: clearedEarnings + pendingEarnings,
      clearedEarnings,
      pendingEarnings,
      platformFees,
      completedSessions: tutorProfile.completedSessionsCount,
      ratingAvg: tutorProfile.ratingAvg,
      studentsHelpedCount: tutorProfile.studentsHelpedCount,
    };
  }
}
