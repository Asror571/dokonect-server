import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Brands')
@Controller('brands')
export class BrandController {
  constructor(private brandService: BrandService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Brendlar ro'yxati" })
  getBrands(@Param('distributorId') distributorId: string) {
    return this.brandService.getBrands(distributorId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Brend tafsiloti' })
  getBrand(@Param('id') id: string, @Param('distributorId') distributorId: string) {
    return this.brandService.getBrand(id, distributorId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yangi brend' })
  createBrand(
    @CurrentUser('distributor') distributor: any,
    @Body()
    body: {
      name: string;
      logo?: string;
    },
  ) {
    return this.brandService.createBrand(distributor.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Brendni tahrirlash' })
  updateBrand(
    @Param('id') id: string,
    @CurrentUser('distributor') distributor: any,
    @Body()
    body: {
      name?: string;
      logo?: string;
    },
  ) {
    return this.brandService.updateBrand(id, distributor.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DISTRIBUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Brendni o'chirish" })
  deleteBrand(@Param('id') id: string, @CurrentUser('distributor') distributor: any) {
    return this.brandService.deleteBrand(id, distributor.id);
  }
}
