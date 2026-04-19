import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PromoCodeController } from './promo-code.controller';
import { PromoCodeService } from './promo-code.service';

@Module({
  controllers: [PricingController, PromoCodeController],
  providers: [PricingService, PromoCodeService],
  exports: [PricingService, PromoCodeService],
})
export class PricingModule {}
