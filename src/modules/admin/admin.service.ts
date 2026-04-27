import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      totalOrders,
      todayOrders,
      yesterdayOrders,
      revenue,
      todayRevenue,
      yesterdayRevenue,
      activeDrivers,
      pendingDeliveries,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: yesterday, lt: today } },
        _sum: { totalAmount: true },
      }),
      this.prisma.driver.count({ where: { isOnline: true } }),
      this.prisma.order.count({
        where: { status: { in: ['NEW', 'ACCEPTED', 'IN_TRANSIT'] } },
      }),
    ]);

    const ordersTrend =
      yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0;

    const yesterdayRevenueSum = yesterdayRevenue._sum.totalAmount || 0;
    const todayRevenueSum = todayRevenue._sum.totalAmount || 0;

    const revenueTrend =
      yesterdayRevenueSum > 0
        ? ((todayRevenueSum - yesterdayRevenueSum) / yesterdayRevenueSum) * 100
        : 0;

    return {
      totalOrders,
      ordersTrend: Math.round(ordersTrend),
      revenue: revenue._sum.totalAmount || 0,
      revenueTrend: Math.round(revenueTrend),
      activeDrivers,
      pendingDeliveries,
    };
  }

  async getRecentOrders(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      take: status ? undefined : 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { include: { user: true } },
        distributor: true,
        driver: { include: { user: true } },
        items: { include: { product: true } },
      },
    });
  }

  async getActiveDrivers() {
    return this.prisma.driver.findMany({
      where: { isOnline: true },
      include: { user: true },
      orderBy: { rating: 'desc' },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        client: true,
        distributor: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserStatus(userId: string, status: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });
  }

  async getAnalytics(period: string = '7d') {
    const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      include: { items: true },
    });

    const revenueByDay = orders.reduce((acc: any, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {});

    return {
      revenueByDay,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }

  async getAllDistributors() {
    const distributors = await this.prisma.distributor.findMany({
      include: {
        user: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    return { success: true, data: distributors };
  }

  async createDistributor(data: any) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        role: 'DISTRIBUTOR',
        status: 'ACTIVE',
      },
    });

    const distributor = await this.prisma.distributor.create({
      data: {
        userId: user.id,
        companyName: data.companyName,
        address: data.address,
        phone: data.phone,
        isVerified: data.isVerified || false,
      },
      include: { user: true },
    });

    return { success: true, data: distributor };
  }

  async updateDistributor(id: string, data: any) {
    const distributor = await this.prisma.distributor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!distributor) {
      throw new Error('Distributor topilmadi');
    }

    await this.prisma.user.update({
      where: { id: distributor.userId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        status: data.status,
      },
    });

    const updated = await this.prisma.distributor.update({
      where: { id },
      data: {
        companyName: data.companyName,
        address: data.address,
        phone: data.phone,
        isVerified: data.isVerified,
      },
      include: { user: true },
    });

    if (data.password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await this.prisma.user.update({
        where: { id: distributor.userId },
        data: { password: hashedPassword },
      });
    }

    return { success: true, data: updated };
  }

  async deleteDistributor(id: string) {
    const distributor = await this.prisma.distributor.findUnique({
      where: { id },
    });

    if (!distributor) {
      throw new Error('Distributor topilmadi');
    }

    await this.prisma.distributor.delete({
      where: { id },
    });

    return { success: true, message: 'Distributor o\'chirildi' };
  }
}
