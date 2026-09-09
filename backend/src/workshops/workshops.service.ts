import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { WorkshopStatus, WorkshopType } from '@prisma/client';

@Injectable()
export class WorkshopsService {
  constructor(private prisma: PrismaService) {}

  async create(tutorId: string, data: any) {
    return this.prisma.workshop.create({
      data: {
        tutorId,
        title: data.title,
        description: data.description,
        type: data.priceEGP ? WorkshopType.PAID : WorkshopType.FREE,
        priceEGP: data.priceEGP,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        capacity: data.capacity,
        status: WorkshopStatus.PENDING,
      },
    });
  }

  async findAll(status?: WorkshopStatus) {
    return this.prisma.workshop.findMany({
      where: status ? { status } : undefined,
      include: { tutor: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTutor(tutorId: string) {
    return this.prisma.workshop.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: WorkshopStatus) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id } });
    if (!workshop) throw new NotFoundException('Workshop not found');

    return this.prisma.workshop.update({
      where: { id },
      data: { status },
    });
  }

  async grantFreeAccess(workshopId: string, studentId: string, adminId: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) throw new NotFoundException('Workshop not found');
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.workshopFreeAccess.create({
      data: {
        workshopId,
        studentId,
        grantedById: adminId,
      },
    });
  }
}
