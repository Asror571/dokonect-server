import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
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
@Roles(Role.DISTRIBUTOR)
@ApiBearerAuth()
export class DistributorController {
    constructor(private distributorService: DistributorService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Distributor dashboard' })
    getDashboard(@CurrentUser('distributor') distributor: any) {
        return this.distributorService.getDashboard(distributor.id);
    }

    @Get('orders')
    @ApiOperation({ summary: 'Distributor buyurtmalari' })
    getOrders(
        @CurrentUser('distributor') distributor: any,
        @Query('status') status?: string,
    ) {
        return this.distributorService.getOrders(distributor.id, status);
    }

    @Post('orders/:orderId/accept')
    @ApiOperation({ summary: 'Buyurtmani qabul qilish' })
    acceptOrder(
        @Param('orderId') orderId: string,
        @CurrentUser('distributor') distributor: any,
    ) {
        return this.distributorService.acceptOrder(orderId, distributor.id);
    }

    @Post('orders/:orderId/reject')
    @ApiOperation({ summary: 'Buyurtmani rad etish' })
    rejectOrder(
        @Param('orderId') orderId: string,
        @CurrentUser('distributor') distributor: any,
        @Body('reason') reason: string,
    ) {
        return this.distributorService.rejectOrder(orderId, distributor.id, reason);
    }

    @Get('stock-logs')
    @ApiOperation({ summary: 'Stok tarixi' })
    getStockLogs(@CurrentUser('distributor') distributor: any) {
        return this.distributorService.getStockLogs(distributor.id);
    }

    @Patch('products/:productId/stock')
    @ApiOperation({ summary: 'Stokni yangilash' })
    updateStock(
        @Param('productId') productId: string,
        @CurrentUser('distributor') distributor: any,
        @Body() body: { quantity: number; type: 'IN' | 'OUT' | 'ADJUSTMENT'; note?: string },
    ) {
        return this.distributorService.updateStock(
            productId,
            distributor.id,
            body.quantity,
            body.type,
            body.note,
        );
    }
}
