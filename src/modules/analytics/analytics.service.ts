import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  async getDistributorAnalytics(distributorId: string | null, period: string = '7d') {
    const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where = distributorId ? { distributorId } : {};
    const orderWhere = distributorId
      ? { distributorId, createdAt: { gte: startDate } }
      : { createdAt: { gte: startDate } };

    const [orders, revenue, topProducts] = await Promise.all([
      this.prisma.order.findMany({
        where: orderWhere,
      }),
      this.prisma.order.aggregate({
        where: orderWhere,
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: orderWhere,
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
    ]);

    const revenueByDay = orders.reduce((acc: any, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {});

    return {
      totalOrders: orders.length,
      totalRevenue: revenue._sum.totalAmount || 0,
      revenueByDay,
      topProducts,
    };
  }

  async getClientAnalytics(clientId: string, period: string = '7d') {
    const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [orders, spending] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          clientId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          clientId,
          createdAt: { gte: startDate },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const spendingByDay = orders.reduce((acc: any, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {});

    return {
      totalOrders: orders.length,
      totalSpending: spending._sum.totalAmount || 0,
      spendingByDay,
    };
  }
}
