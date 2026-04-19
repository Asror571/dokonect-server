import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductAnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Sales Velocity hisoblash
  async calculateSalesVelocity(productId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Oxirgi 7 va 30 kunlik sotuvlar
    const [last7Days, last30Days] = await Promise.all([
      this.prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            createdAt: { gte: sevenDaysAgo },
            status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED'] },
          },
        },
        _sum: { quantity: true },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            createdAt: { gte: thirtyDaysAgo },
            status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED'] },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const last7DaysSales = last7Days._sum.quantity || 0;
    const last30DaysSales = last30Days._sum.quantity || 0;

    const dailyAverage = last7DaysSales / 7;
    const weeklyAverage = last7DaysSales;
    const monthlyAverage = last30DaysSales;

    // Stock holatini tekshirish
    const inventory = await this.prisma.inventory.aggregate({
      where: { productId },
      _sum: { quantity: true, reserved: true },
    });

    const totalStock = (inventory._sum.quantity || 0) - (inventory._sum.reserved || 0);
    const daysUntilStockout = dailyAverage > 0 ? Math.floor(totalStock / dailyAverage) : null;

    // Status aniqlash
    let status: 'FAST' | 'MEDIUM' | 'SLOW' | 'DEAD' = 'MEDIUM';
    if (dailyAverage === 0) {
      status = 'DEAD';
    } else if (dailyAverage >= 10) {
      status = 'FAST';
    } else if (dailyAverage < 2) {
      status = 'SLOW';
    }

    // SalesVelocity ni yangilash yoki yaratish
    await this.prisma.salesVelocity.upsert({
      where: { productId },
      create: {
        productId,
        last7DaysSales,
        last30DaysSales,
        dailyAverage,
        weeklyAverage,
        monthlyAverage,
        daysUntilStockout,
        status,
      },
      update: {
        last7DaysSales,
        last30DaysSales,
        dailyAverage,
        weeklyAverage,
        monthlyAverage,
        daysUntilStockout,
        status,
        lastCalculated: new Date(),
      },
    });

    return {
      last7DaysSales,
      last30DaysSales,
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      daysUntilStockout,
      status,
      totalStock,
    };
  }

  // Mahsulot analitikasi (7/30 kunlik grafik)
  async getProductAnalytics(productId: string, period: '7d' | '30d' = '7d') {
    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Kunlik sotuv ma'lumotlari
    const orders = await this.prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          createdAt: { gte: startDate },
          status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED'] },
        },
      },
      include: {
        order: {
          select: { createdAt: true },
        },
      },
    });

    // Kunlik sotuv grafigi
    const salesByDay: Record<string, number> = {};
    orders.forEach((item) => {
      const date = item.order.createdAt.toISOString().split('T')[0];
      salesByDay[date] = (salesByDay[date] || 0) + item.quantity;
    });

    // Umumiy sotilgan
    const totalSold = orders.reduce((sum, item) => sum + item.quantity, 0);

    // Sales velocity
    const velocity = await this.prisma.salesVelocity.findUnique({
      where: { productId },
    });

    return {
      period,
      salesByDay,
      totalSold,
      averageDaily: totalSold / days,
      velocity,
    };
  }

  // Barcha mahsulotlar uchun sales velocity ni yangilash
  async updateAllSalesVelocities(distributorId: string) {
    const products = await this.prisma.product.findMany({
      where: { distributorId },
      select: { id: true },
    });

    const results = await Promise.all(products.map((p) => this.calculateSalesVelocity(p.id)));

    return {
      updated: results.length,
      message: `${results.length} ta mahsulot yangilandi`,
    };
  }

  // Smart Alerts yaratish
  async checkAndCreateAlerts(distributorId: string) {
    const alerts = [];

    // Low stock alerts
    const lowStockProducts = await this.prisma.inventory.findMany({
      where: {
        product: { distributorId },
        quantity: { lte: this.prisma.inventory.fields.minThreshold },
      },
      include: { product: true },
    });

    for (const inv of lowStockProducts) {
      const existingAlert = await this.prisma.productAlert.findFirst({
        where: {
          productId: inv.productId,
          alertType: 'LOW_STOCK',
          isRead: false,
        },
      });

      if (!existingAlert) {
        const alert = await this.prisma.productAlert.create({
          data: {
            productId: inv.productId,
            distributorId,
            alertType: 'LOW_STOCK',
            message: `${inv.product.name} kam qoldi (${inv.quantity} dona)`,
          },
        });
        alerts.push(alert);
      }
    }

    // Slow moving alerts
    const slowProducts = await this.prisma.salesVelocity.findMany({
      where: {
        product: { distributorId },
        status: 'DEAD',
      },
      include: { product: true },
    });

    for (const velocity of slowProducts) {
      const existingAlert = await this.prisma.productAlert.findFirst({
        where: {
          productId: velocity.productId,
          alertType: 'SLOW_MOVING',
          isRead: false,
        },
      });

      if (!existingAlert) {
        const alert = await this.prisma.productAlert.create({
          data: {
            productId: velocity.productId,
            distributorId,
            alertType: 'SLOW_MOVING',
            message: `${velocity.product.name} uzoq vaqtdan beri sotilmayapti`,
          },
        });
        alerts.push(alert);
      }
    }

    // Fast moving alerts
    const fastProducts = await this.prisma.salesVelocity.findMany({
      where: {
        product: { distributorId },
        status: 'FAST',
        daysUntilStockout: { lte: 7 },
      },
      include: { product: true },
    });

    for (const velocity of fastProducts) {
      const existingAlert = await this.prisma.productAlert.findFirst({
        where: {
          productId: velocity.productId,
          alertType: 'FAST_MOVING',
          isRead: false,
        },
      });

      if (!existingAlert) {
        const alert = await this.prisma.productAlert.create({
          data: {
            productId: velocity.productId,
            distributorId,
            alertType: 'FAST_MOVING',
            message: `${velocity.product.name} tez sotilmoqda, ${velocity.daysUntilStockout} kunda tugaydi`,
          },
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  // Alertlarni olish
  async getAlerts(distributorId: string, isRead?: boolean) {
    const where: any = { distributorId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return this.prisma.productAlert.findMany({
      where,
      include: {
        product: {
          include: {
            images: { where: { isCover: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Alertni o'qilgan deb belgilash
  async markAlertAsRead(alertId: string) {
    return this.prisma.productAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }
}
