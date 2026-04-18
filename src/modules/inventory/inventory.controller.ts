import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DISTRIBUTOR)
@ApiBearerAuth()
export class InventoryController {
    constructor(private inventoryService: InventoryService) { }

    @Get()
    @ApiOperation({ summary: 'Inventar ro\'yxati' })
    getInventory(
        @CurrentUser('distributor') distributor: any,
        @Query('warehouseId') warehouseId?: string,
    ) {
        return this.inventoryService.getInventory(distributor.id, warehouseId);
    }

    @Patch(':inventoryId')
    @ApiOperation({ summary: 'Inventarni yangilash' })
    updateInventory(
        @Param('inventoryId') inventoryId: string,
        @CurrentUser('distributor') distributor: any,
        @Body() body: { quantity: number; type: 'IN' | 'OUT' | 'ADJUSTMENT' },
    ) {
        return this.inventoryService.updateInventory(
            inventoryId,
            distributor.id,
            body.quantity,
            body.type,
        );
    }

    @Get('low-stock')
    @ApiOperation({ summary: 'Kam qolgan mahsulotlar' })
    getLowStockItems(@CurrentUser('distributor') distributor: any) {
        return this.inventoryService.getLowStockItems(distributor.id);
    }

    @Post('transfer')
    @ApiOperation({ summary: 'Ombor o\'rtasida transfer' })
    transferStock(
        @CurrentUser('distributor') distributor: any,
        @Body()
        body: {
            sourceWarehouseId: string;
            destWarehouseId: string;
            productId: string;
            variantId?: string;
            quantity: number;
        },
    ) {
        return this.inventoryService.transferStock(
            body.sourceWarehouseId,
            body.destWarehouseId,
            body.productId,
            body.variantId || null,
            body.quantity,
            distributor.id,
        );
    }

    @Patch('transfer/:transferId/complete')
    @ApiOperation({ summary: 'Transferni yakunlash' })
    completeTransfer(
        @Param('transferId') transferId: string,
        @CurrentUser('distributor') distributor: any,
    ) {
        return this.inventoryService.completeTransfer(transferId, distributor.id);
    }

    @Get('transfers')
    @ApiOperation({ summary: 'Transfer tarixi' })
    getTransfers(@CurrentUser('distributor') distributor: any) {
        return this.inventoryService.getTransfers(distributor.id);
    }
}
