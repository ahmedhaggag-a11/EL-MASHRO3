import { Module } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { WorkshopsService } from './workshops.service';
import { WorkshopsController } from './workshops.controller';

@Module({
  providers: [WorkshopsService, PrismaService],
  controllers: [WorkshopsController]
})
export class WorkshopsModule {}
