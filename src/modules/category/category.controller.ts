import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
    constructor(private categoryService: CategoryService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Kategoriyalar ro\'yxati' })
    getCategories(@Param('distributorId') distributorId: string) {
        return this.categoryService.getCategories(distributorId);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Kategoriya tafsiloti' })
    getCategory(
        @Param('id') id: string,
        @Param('distributorId') distributorId: string,
    ) {
        return this.categoryService.getCategory(id, distributorId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Yangi kategoriya' })
    createCategory(
        @CurrentUser('distributor') distributor: any,
        @Body()
        body: {
            name: string;
            parentId?: string;
            image?: string;
            icon?: string;
            order?: number;
        },
    ) {
        return this.categoryService.createCategory(distributor.id, body);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Kategoriyani tahrirlash' })
    updateCategory(
        @Param('id') id: string,
        @CurrentUser('distributor') distributor: any,
        @Body()
        body: {
            name?: string;
            parentId?: string;
            image?: string;
            icon?: string;
            order?: number;
        },
    ) {
        return this.categoryService.updateCategory(id, distributor.id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Kategoriyani o\'chirish' })
    deleteCategory(
        @Param('id') id: string,
        @CurrentUser('distributor') distributor: any,
    ) {
        return this.categoryService.deleteCategory(id, distributor.id);
    }
}
