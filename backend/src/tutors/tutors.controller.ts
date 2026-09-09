import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeachingMode } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TutorsService } from './tutors.service';

import { Public } from '../common/decorators/public.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tutors')
export class TutorsController {
  constructor(private tutorsService: TutorsService) {}

  @Public()
  @Get('featured')
  getFeaturedTutors() {
    return this.tutorsService.getFeaturedTutors();
  }

  @Post('apply')
  submitApplication(
    @Req() req: any,
    @Body()
    dto: {
      universityName: string;
      facultyName: string;
      departmentName?: string;
      experienceSummary?: string;
      introVideoUrl?: string;
      preferredMode?: TeachingMode;
    },
  ) {
    return this.tutorsService.submitApplication(req.user.id, dto);
  }

  @Get('my-application')
  getMyApplication(@Req() req: any) {
    return this.tutorsService.getMyApplication(req.user.id);
  }

  @Roles('TUTOR')
  @Get('leads')
  getLeads(@Req() req: any) {
    return this.tutorsService.getLeadsForTutor(req.user.id);
  }

  @Roles('TUTOR')
  @Get('bookings')
  getBookings(@Req() req: any) {
    return this.tutorsService.getMyBookings(req.user.id);
  }

  @Roles('TUTOR')
  @Get('earnings')
  getEarnings(@Req() req: any) {
    return this.tutorsService.getEarningsSummary(req.user.id);
  }
}
