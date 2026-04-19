import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Warehouses')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DISTRIBUTOR)
@ApiBearerAuth()
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @Get()
  @ApiOperation({ summary: "Omborlar ro'yxati" })
  getWarehouses(@CurrentUser('distributor') distributor: any) {
    return this.warehouseService.getWarehouses(distributor.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ombor tafsiloti' })
  getWarehouse(@Param('id') id: string, @CurrentUser('distributor') distributor: any) {
    return this.warehouseService.getWarehouse(id, distributor.id);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi ombor yaratish' })
  createWarehouse(
    @CurrentUser('distributor') distributor: any,
    @Body()
    body: {
      name: string;
      address: string;
      region: string;
      managerId?: string;
    },
  ) {
    return this.warehouseService.createWarehouse(distributor.id, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Omborni tahrirlash' })
  updateWarehouse(
    @Param('id') id: string,
    @CurrentUser('distributor') distributor: any,
    @Body()
    body: {
      name?: string;
      address?: string;
      region?: string;
      managerId?: string;
      isActive?: boolean;
    },
  ) {
    return this.warehouseService.updateWarehouse(id, distributor.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Omborni o'chirish" })
  deleteWarehouse(@Param('id') id: string, @CurrentUser('distributor') distributor: any) {
    return this.warehouseService.deleteWarehouse(id, distributor.id);
  }
}
