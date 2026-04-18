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
}
