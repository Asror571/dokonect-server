import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) { }

  @Get('distributor')
  @Roles(Role.DISTRIBUTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Distributor analitikasi' })
  getDistributorAnalytics(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const distributorId = user.distributor?.id || null;
    return this.analyticsService.getDistributorAnalytics(distributorId, period, from, to);
  }

  @Get('payments')
  @Roles(Role.DISTRIBUTOR, Role.ADMIN)
  @ApiOperation({ summary: "To'lovlar tahlili" })
  getPaymentsAnalytics(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const distributorId = user.distributor?.id || null;
    return this.analyticsService.getPaymentsAnalytics(distributorId, from, to, period);
  }

  @Get('client')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Client analitikasi' })
  getClientAnalytics(@CurrentUser('client') client: any, @Query('period') period?: string) {
    return this.analyticsService.getClientAnalytics(client.id, period);
  }
}
