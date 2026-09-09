import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RequestStatus,
  RoleName,
  TutorApplicationStatus,
} from '@prisma/client';
import { PrismaService } from '../config/prisma.service';
import { SettingsService } from './settings.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  // ------------------------------------------------------------
  // 1. PLATFORM OVERVIEW / STATS
  // ------------------------------------------------------------
  async getOverviewStats() {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      pendingApplications,
      totalRequests,
      activeRequests,
      disputedRequests,
      completedRequests,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.userRole.count({ where: { role: RoleName.STUDENT } }),
      this.prisma.userRole.count({ where: { role: RoleName.TUTOR } }),
      this.prisma.tutorApplication.count({
        where: {
          status: {
            in: [
              TutorApplicationStatus.PENDING,
              TutorApplicationStatus.UNDER_REVIEW,
            ],
          },
        },
      }),
      this.prisma.request.count(),
      this.prisma.request.count({
        where: {
          status: {
            in: [
              RequestStatus.PUBLISHED,
              RequestStatus.MATCHING,
              RequestStatus.TUTOR_SELECTED,
              RequestStatus.CONFIRMED,
              RequestStatus.IN_PROGRESS,
            ],
          },
        },
      }),
      this.prisma.request.count({
        where: { status: RequestStatus.DISPUTED },
      }),
      this.prisma.request.count({
        where: { status: RequestStatus.COMPLETED },
      }),
    ]);

    const commissionPercent = await this.settings.getNumber('COMMISSION_PERCENT');

    return {
      totalUsers,
      totalStudents,
      totalTutors,
      pendingApplications,
      totalRequests,
      activeRequests,
      disputedRequests,
      completedRequests,
      commissionPercent,
    };
  }

  // ------------------------------------------------------------
  // 2. TEACHER APPLICATIONS (ACCEPT / REJECT / REQUEST CHANGES)
  // ------------------------------------------------------------
  async getTutorApplications(status?: TutorApplicationStatus) {
    return this.prisma.tutorApplication.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
            tutorProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewTutorApplication(
    applicationId: string,
    adminId: string,
    dto: {
      status: TutorApplicationStatus;
      adminNotes?: string;
    },
  ) {
    const application = await this.prisma.tutorApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Tutor application not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update the application status
      const updatedApp = await tx.tutorApplication.update({
        where: { id: applicationId },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes,
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
        },
      });

      // 2. If ACCEPTED, grant TUTOR role and create/update TutorProfile
      if (dto.status === TutorApplicationStatus.ACCEPTED) {
        // Ensure user has TUTOR role
        await tx.userRole.upsert({
          where: {
            userId_role: {
              userId: application.userId,
              role: RoleName.TUTOR,
            },
          },
          create: {
            userId: application.userId,
            role: RoleName.TUTOR,
          },
          update: {},
        });

        // Ensure TutorProfile is created and marked verified
        await tx.tutorProfile.upsert({
          where: { userId: application.userId },
          create: {
            userId: application.userId,
            bio: application.experienceSummary ?? 'مدرس معتمد في فك زنقة',
            teachingMode: application.preferredMode,
            isVerified: true,
            verifiedAt: new Date(),
            priceMinEGP: 150,
            priceMaxEGP: 400,
          },
          update: {
            isVerified: true,
            verifiedAt: new Date(),
            teachingMode: application.preferredMode,
          },
        });
      }

      // 3. If REJECTED, make sure tutor verification is false
      if (dto.status === TutorApplicationStatus.REJECTED) {
        const existingProfile = await tx.tutorProfile.findUnique({
          where: { userId: application.userId },
        });
        if (existingProfile) {
          await tx.tutorProfile.update({
            where: { userId: application.userId },
            data: { isVerified: false },
          });
        }
      }

      return updatedApp;
    });
  }

  // ------------------------------------------------------------
  // 3. ALL STUDENT REQUESTS OVERSIGHT
  // ------------------------------------------------------------
  async getAllRequests(filters?: {
    status?: RequestStatus;
    search?: string;
  }) {
    const where: Prisma.RequestWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { student: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { student: { email: { contains: filters.search, mode: 'insensitive' } } },
        { subject: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.request.findMany({
      where,
      include: {
        student: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        subject: true,
        topic: true,
        matches: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
          },
        },
        booking: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
            payment: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async overrideRequestStatus(
    requestId: string,
    adminId: string,
    newStatus: RequestStatus,
    reason?: string,
  ) {
    const req = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException('Request not found');

    return this.prisma.$transaction([
      this.prisma.request.update({
        where: { id: requestId },
        data: { status: newStatus },
      }),
      this.prisma.requestStatusHistory.create({
        data: {
          requestId,
          fromStatus: req.status,
          toStatus: newStatus,
          changedByUserId: adminId,
          reason: reason ?? 'Admin status override',
        },
      }),
    ]);
  }

  // ------------------------------------------------------------
  // 4. USER DIRECTORY & PERMISSIONS
  // ------------------------------------------------------------
  async getUsers(search?: string, role?: RoleName) {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.roles = {
        some: { role },
      };
    }

    return this.prisma.user.findMany({
      where,
      include: {
        roles: true,
        studentProfile: true,
        tutorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async grantUserRole(userId: string, role: RoleName) {
    return this.prisma.userRole.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role },
      update: {},
    });
  }

  async revokeUserRole(userId: string, role: RoleName) {
    return this.prisma.userRole.deleteMany({
      where: { userId, role },
    });
  }

  // ------------------------------------------------------------
  // 5. DISPUTES & RESOLUTION
  // ------------------------------------------------------------
  async getDisputedRequests() {
    return this.prisma.request.findMany({
      where: { status: RequestStatus.DISPUTED },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        booking: {
          include: {
            tutor: { include: { user: true } },
            payment: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async resolveDispute(
    requestId: string,
    adminId: string,
    resolution: 'REFUND_STUDENT' | 'PAYOUT_TUTOR' | 'SPLIT',
    adminNotes?: string,
  ) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: { booking: { include: { payment: true } } },
    });

    if (!request) throw new NotFoundException('Request not found');

    return this.prisma.$transaction(async (tx) => {
      const nextStatus =
        resolution === 'REFUND_STUDENT'
          ? RequestStatus.CANCELLED
          : RequestStatus.COMPLETED;

      await tx.request.update({
        where: { id: requestId },
        data: { status: nextStatus },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId,
          fromStatus: RequestStatus.DISPUTED,
          toStatus: nextStatus,
          changedByUserId: adminId,
          reason: `Dispute resolved (${resolution}): ${adminNotes ?? 'No notes'}`,
        },
      });

      return { success: true, resolution, nextStatus };
    });
  }
}
