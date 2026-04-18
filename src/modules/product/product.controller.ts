import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
export class ProductController {
    constructor(private productService: ProductService) { }

    @Get()
    @ApiOperation({ summary: 'Barcha mahsulotlar' })
    findAll(@Query() query: ProductQueryDto) {
        return this.productService.findAll(query);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Kategoriyalar ro\'yxati' })
    getCategories(@Query('distributorId') distributorId?: string) {
        return this.productService.getCategories(distributorId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Bitta mahsulot' })
    findOne(@Param('id') id: string) {
        return this.productService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Yangi mahsulot yaratish (Distributor)' })
    create(
        @CurrentUser('distributor') distributor: any,
        @Body() dto: CreateProductDto,
    ) {
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
        @Body() dto: UpdateProductDto,
    ) {
        return this.productService.update(id, distributor.id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mahsulotni o\'chirish (Distributor)' })
    remove(
        @Param('id') id: string,
        @CurrentUser('distributor') distributor: any,
    ) {
        return this.productService.remove(id, distributor.id);
    }
}
