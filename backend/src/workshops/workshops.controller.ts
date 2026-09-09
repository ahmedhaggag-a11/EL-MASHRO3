import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkshopStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { WorkshopsService } from './workshops.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('workshops')
export class WorkshopsController {
  constructor(private workshopsService: WorkshopsService) {}

  @Roles('TUTOR')
  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.workshopsService.create(req.user.id, body);
  }

  @Roles('TUTOR')
  @Get('my')
  getMyWorkshops(@Req() req: any) {
    return this.workshopsService.findByTutor(req.user.id);
  }

  @Roles('ADMIN')
  @Get()
  getAll(@Query('status') status?: WorkshopStatus) {
    return this.workshopsService.findAll(status);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: WorkshopStatus) {
    return this.workshopsService.updateStatus(id, status);
  }

  @Roles('ADMIN')
  @Post(':id/grant-free')
  grantFree(
    @Param('id') workshopId: string,
    @Body('studentId') studentId: string,
    @Req() req: any,
  ) {
    return this.workshopsService.grantFreeAccess(workshopId, studentId, req.user.id);
  }
}
