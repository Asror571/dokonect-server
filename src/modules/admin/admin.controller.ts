import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard statistikasi' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Barcha buyurtmalar' })
  getRecentOrders(@Query('status') status?: string) {
    return this.adminService.getRecentOrders(status);
  }

  @Get('drivers/active')
  @ApiOperation({ summary: 'Faol haydovchilar' })
  getActiveDrivers() {
    return this.adminService.getActiveDrivers();
  }

  @Get('users')
  @ApiOperation({ summary: 'Barcha foydalanuvchilar' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:userId/status')
  @ApiOperation({ summary: "Foydalanuvchi statusini o'zgartirish" })
  updateUserStatus(@Param('userId') userId: string, @Body('status') status: string) {
    return this.adminService.updateUserStatus(userId, status);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Analitika' })
  getAnalytics(@Query('period') period?: string) {
    return this.adminService.getAnalytics(period);
  }

  @Get('distributors')
  @ApiOperation({ summary: 'Barcha distributorlar' })
  getAllDistributors() {
    return this.adminService.getAllDistributors();
  }

  @Post('distributors')
  @ApiOperation({ summary: 'Distributor yaratish' })
  createDistributor(@Body() data: any) {
    return this.adminService.createDistributor(data);
  }

  @Put('distributors/:id')
  @Patch('distributors/:id')
  @ApiOperation({ summary: 'Distributorni tahrirlash' })
  updateDistributor(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateDistributor(id, data);
  }

  @Delete('distributors/:id')
  @ApiOperation({ summary: 'Distributorni o\'chirish' })
  deleteDistributor(@Param('id') id: string) {
    return this.adminService.deleteDistributor(id);
  }
}
