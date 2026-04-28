import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DistributorService } from './distributor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Distributor')
@Controller('distributor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DISTRIBUTOR, Role.ADMIN)
@ApiBearerAuth()
export class DistributorController {
  constructor(private distributorService: DistributorService) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Distributor dashboard' })
  getDashboard(@CurrentUser() user: any) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.getDashboard(distributorId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Distributor profili' })
  getProfile(@CurrentUser() user: any) {
    return this.distributorService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Profilni yangilash' })
  updateProfile(@CurrentUser() user: any, @Body() data: any) {
    return this.distributorService.updateProfile(user.id, data);
  }

  @Get('products-dashboard')
  @ApiOperation({ summary: 'Mahsulotlar mini dashboard' })
  getProductsDashboard(@CurrentUser() user: any) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.getProductsDashboard(distributorId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Distributor buyurtmalari' })
  getOrders(@CurrentUser() user: any, @Query('status') status?: string) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.getOrders(distributorId, status);
  }

  @Post('orders/:orderId/accept')
  @ApiOperation({ summary: 'Buyurtmani qabul qilish' })
  acceptOrder(@Param('orderId') orderId: string, @CurrentUser() user: any) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.acceptOrder(orderId, distributorId);
  }

  @Post('orders/:orderId/reject')
  @ApiOperation({ summary: 'Buyurtmani rad etish' })
  rejectOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
    @Body('reason') reason: string,
  ) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.rejectOrder(orderId, distributorId, reason);
  }

  @Get('stock-logs')
  @ApiOperation({ summary: 'Stok tarixi' })
  getStockLogs(@CurrentUser() user: any) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.getStockLogs(distributorId);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventar ro\'yxati' })
  getInventory(
    @CurrentUser() user: any,
    @Query('warehouseId') warehouseId?: string,
  ) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.getInventory(distributorId, warehouseId);
  }

  @Patch('products/:productId/stock')
  @ApiOperation({ summary: 'Stokni yangilash' })
  async updateStock(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Body() body: { quantity: number; type: 'IN' | 'OUT' | 'ADJUSTMENT'; note?: string },
  ) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.updateStock(
      productId,
      distributorId,
      body.quantity,
      body.type,
      body.note,
    );
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Haydovchilar ro\'yxati' })
  getDrivers(@CurrentUser() user: any) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.getDrivers(distributorId);
  }

  @Post('drivers')
  @ApiOperation({ summary: 'Haydovchi qo\'shish' })
  async createDriver(@CurrentUser() user: any, @Body() data: any) {
    try {
      const distributorId = user.distributor?.id || null;
      return await this.distributorService.createDriver(distributorId, data);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  @Patch('drivers/:driverId')
  @Put('drivers/:driverId')
  @ApiOperation({ summary: 'Haydovchini yangilash' })
  updateDriver(
    @Param('driverId') driverId: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.updateDriver(driverId, distributorId, data);
  }

  @Delete('drivers/:driverId')
  @ApiOperation({ summary: 'Haydovchini o\'chirish' })
  deleteDriver(
    @Param('driverId') driverId: string,
    @CurrentUser() user: any,
  ) {
    const distributorId = user.distributor?.id || null;
    return this.distributorService.deleteDriver(driverId, distributorId);
  }
}
