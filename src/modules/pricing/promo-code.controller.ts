import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromoCodeService } from './promo-code.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Promo Codes')
@Controller('promo-codes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PromoCodeController {
    constructor(private promoCodeService: PromoCodeService) { }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiOperation({ summary: 'Promo kodlar ro\'yxati' })
    getPromoCodes(@CurrentUser('distributor') distributor: any) {
        return this.promoCodeService.getPromoCodes(distributor.id);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiOperation({ summary: 'Yangi promo kod' })
    createPromoCode(
        @CurrentUser('distributor') distributor: any,
        @Body()
        body: {
            code: string;
            discountType: 'PERCENT' | 'FIXED';
            discountValue: number;
            minOrderAmount?: number;
            maxUses?: number;
            usesPerClient?: number;
            validFrom?: Date;
            validTo?: Date;
            applicableTo?: any;
        },
    ) {
        return this.promoCodeService.createPromoCode(distributor.id, body);
    }

    @Put(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiOperation({ summary: 'Promo kodni tahrirlash' })
    updatePromoCode(
        @Param('id') id: string,
        @CurrentUser('distributor') distributor: any,
        @Body()
        body: {
            discountValue?: number;
            minOrderAmount?: number;
            maxUses?: number;
            usesPerClient?: number;
            validFrom?: Date;
            validTo?: Date;
        },
    ) {
        return this.promoCodeService.updatePromoCode(id, distributor.id, body);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.DISTRIBUTOR)
    @ApiOperation({ summary: 'Promo kodni o\'chirish' })
    deletePromoCode(
        @Param('id') id: string,
        @CurrentUser('distributor') distributor: any,
    ) {
        return this.promoCodeService.deletePromoCode(id, distributor.id);
    }

    @Post('validate')
    @UseGuards(RolesGuard)
    @Roles(Role.CLIENT)
    @ApiOperation({ summary: 'Promo kodni tekshirish' })
    validatePromoCode(
        @CurrentUser('client') client: any,
        @Body() body: { code: string; orderAmount: number },
    ) {
        return this.promoCodeService.validatePromoCode(body.code, client.id, body.orderAmount);
    }
}
