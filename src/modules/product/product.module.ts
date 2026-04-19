import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductAlertsController } from './product-alerts.controller';
import { ProductService } from './product.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { ProductHistoryService } from './product-history.service';

@Module({
  controllers: [ProductController, ProductAlertsController],
  providers: [ProductService, ProductAnalyticsService, ProductHistoryService],
  exports: [ProductService, ProductAnalyticsService, ProductHistoryService],
})
export class ProductModule {}
