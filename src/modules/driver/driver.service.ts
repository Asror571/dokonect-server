import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DriverService {
    constructor(private prisma: PrismaService) { }

    async getDashboard(driverId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [driver, todayOrders, todayEarnings, activeOrder] = await Promise.all([
            this.prisma.driver.findUnique({
                where: { id: driverId },
                include: { user: true },
            }),
            this.prisma.order.count({
                where: {
                    driverId,
                    status: 'DELIVERED',
                    updatedAt: { gte: today },
                },
            }),
            this.prisma.driverEarning.aggregate({
                where: {
                    driverId,
                    date: { gte: today },
                },
                _sum: { amount: true, bonus: true },
            }),
            this.prisma.order.findFirst({
                where: {
                    driverId,
                    status: { in: ['PICKED', 'IN_TRANSIT'] },
                },
                include: {
                    client: { include: { user: true } },
                    items: { include: { product: true } },
                },
            }),
        ]);

        return {
            driver,
            todayOrders,
            todayEarnings: (todayEarnings._sum.amount || 0) + (todayEarnings._sum.bonus || 0),
            activeOrder,
        };
    }

    async updateLocation(driverId: string, lat: number, lng: number) {
        await Promise.all([
            this.prisma.driver.update({
                where: { id: driverId },
                data: { currentLat: lat, currentLng: lng },
            }),
            this.prisma.driverLocation.create({
                data: { driverId, lat, lng },
            }),
        ]);

        return { success: true };
    }

    async updateStatus(driverId: string, isOnline: boolean) {
        return this.prisma.driver.update({
            where: { id: driverId },
            data: { isOnline },
        });
    }

    async acceptOrder(driverId: string, orderId: string) {
        const order = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                driverId,
                status: 'PICKED',
            },
            include: {
                client: { include: { user: true } },
                distributor: true,
            },
        });

        await this.prisma.orderStatusHistory.create({
            data: {
                orderId,
                status: 'PICKED',
            },
        });

        return order;
    }

    async updateOrderStatus(
        orderId: string,
        driverId: string,
        status: string,
        photoProof?: string,
        signature?: string,
        problemReport?: string,
    ) {
        const order = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: status as any },
            include: {
                client: { include: { user: true } },
                delivery: true,
            },
        });

        await this.prisma.orderStatusHistory.create({
            data: { orderId, status: status as any },
        });

        if (status === 'DELIVERED') {
            if (order.delivery) {
                await this.prisma.delivery.update({
                    where: { orderId },
                    data: {
                        deliveryTime: new Date(),
                        photoProof,
                        signature,
                    },
                });
            }

            // Calculate earnings
            const baseAmount = order.totalAmount * 0.1; // 10% commission
            await this.prisma.driverEarning.create({
                data: {
                    driverId,
                    orderId,
                    amount: baseAmount,
                },
            });
        }

        if (problemReport && order.delivery) {
            await this.prisma.delivery.update({
                where: { orderId },
                data: { problemReport },
            });
        }

        return order;
    }

    async getEarnings(driverId: string, period: string = 'today') {
        let startDate = new Date();
        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const earnings = await this.prisma.driverEarning.findMany({
            where: {
                driverId,
                date: { gte: startDate },
            },
            orderBy: { date: 'desc' },
        });

        const total = earnings.reduce((sum, e) => sum + e.amount + e.bonus, 0);

        return { earnings, total };
    }
}
