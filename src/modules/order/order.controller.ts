import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, OrderStatus } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Buyurtma berish (Client)' })
  create(@CurrentUser('client') client: any, @Body() dto: CreateOrderDto) {
    return this.orderService.create(client.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "O'z buyurtmalarim" })
  findAll(@CurrentUser() user: any, @Query('status') status?: OrderStatus) {
    if (user.role === Role.CLIENT) {
      return this.orderService.findAllForClient(user.client.id, status);
    } else if (user.role === Role.DISTRIBUTOR) {
      return this.orderService.findAllForDistributor(user.distributor.id, status);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buyurtma tafsiloti' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderService.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiOperation({ summary: "Buyurtma statusini o'zgartirish (Distributor)" })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('distributor') distributor: any,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, distributor.id, dto);
  }
}
