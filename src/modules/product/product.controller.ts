import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { ProductHistoryService } from './product-history.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private productService: ProductService,
    private analyticsService: ProductAnalyticsService,
    private historyService: ProductHistoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Barcha mahsulotlar (filters va sort bilan)' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: "Kategoriyalar ro'yxati" })
  getCategories(@Query('distributorId') distributorId?: string) {
    return this.productService.getCategories(distributorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta mahsulot (analytics va history bilan)' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Mahsulot analitikasi (7/30 kunlik grafik)' })
  getAnalytics(@Param('id') id: string, @Query('period') period: '7d' | '30d' = '7d') {
    return this.analyticsService.getProductAnalytics(id, period);
  }

  @Get(':id/history')
  @ApiOperation({ summary: "Mahsulot tarixi (narx va stock o'zgarishlari)" })
  getHistory(@Param('id') id: string) {
    return this.historyService.getProductHistory(id);
  }

  @Post(':id/calculate-velocity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sales velocity hisoblash' })
  calculateVelocity(@Param('id') id: string) {
    return this.analyticsService.calculateSalesVelocity(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi mahsulot yaratish (Distributor)' })
  create(@CurrentUser('distributor') distributor: any, @Body() dto: CreateProductDto) {
    return this.productService.create(distributor.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mahsulotni tahrirlash (Distributor)' })
  update(
    @Param('id') id: string,
    @CurrentUser('distributor') distributor: any,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, distributor.id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mahsulotni o'chirish (Distributor)" })
  remove(@Param('id') id: string, @CurrentUser('distributor') distributor: any) {
    return this.productService.remove(id, distributor.id);
  }
}
