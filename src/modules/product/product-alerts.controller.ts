import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductAnalyticsService } from './product-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Product Alerts')
@Controller('product-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DISTRIBUTOR)
@ApiBearerAuth()
export class ProductAlertsController {
  constructor(private analyticsService: ProductAnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha alertlar' })
  getAlerts(@CurrentUser('distributor') distributor: any, @Query('isRead') isRead?: string) {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.analyticsService.getAlerts(distributor.id, isReadBool);
  }

  @Post('check')
  @ApiOperation({ summary: 'Alertlarni tekshirish va yaratish' })
  checkAlerts(@CurrentUser('distributor') distributor: any) {
    return this.analyticsService.checkAndCreateAlerts(distributor.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: "Alertni o'qilgan deb belgilash" })
  markAsRead(@Param('id') id: string) {
    return this.analyticsService.markAlertAsRead(id);
  }

  @Post('update-velocities')
  @ApiOperation({ summary: 'Barcha mahsulotlar uchun sales velocity yangilash' })
  updateVelocities(@CurrentUser('distributor') distributor: any) {
    return this.analyticsService.updateAllSalesVelocities(distributor.id);
  }
}
