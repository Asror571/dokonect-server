import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductHistoryService {
  constructor(private prisma: PrismaService) {}

  // Narx o'zgarishini qayd qilish
  async logPriceChange(
    productId: string,
    oldPrice: number,
    newPrice: number,
    priceType: 'WHOLESALE' | 'RETAIL' | 'COST',
    changedBy: string,
    reason?: string,
  ) {
    return this.prisma.priceHistory.create({
      data: {
        productId,
        oldPrice,
        newPrice,
        priceType,
        changedBy,
        reason,
      },
    });
  }

  // Narx o'zgarishlari tarixini olish
  async getPriceHistory(productId: string) {
    return this.prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Stock o'zgarishlari tarixini olish
  async getStockHistory(productId: string) {
    return this.prisma.stockLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Mahsulot uchun barcha o'zgarishlar tarixi
  async getProductHistory(productId: string) {
    const [priceHistory, stockHistory] = await Promise.all([
      this.getPriceHistory(productId),
      this.getStockHistory(productId),
    ]);

    return {
      priceHistory,
      stockHistory,
    };
  }
}
