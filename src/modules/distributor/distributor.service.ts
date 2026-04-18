import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DistributorService {
    constructor(private prisma: PrismaService) { }

    async getDashboard(distributorId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [incomingOrders, readyOrders, shippedOrders, lowStockProducts, revenue] =
            await Promise.all([
                this.prisma.order.count({
                    where: { distributorId, status: 'NEW' },
                }),
                this.prisma.order.count({
                    where: { distributorId, status: 'ACCEPTED' },
                }),
                this.prisma.order.count({
                    where: {
                        distributorId,
                        status: { in: ['PICKED', 'IN_TRANSIT', 'DELIVERED'] },
                        createdAt: { gte: today },
                    },
                }),
                this.prisma.product.count({
                    where: { distributorId },
                }),
                this.prisma.order.aggregate({
                    where: {
                        distributorId,
                        createdAt: { gte: today },
                    },
                    _sum: { totalAmount: true },
                }),
            ]);

        return {
            incomingOrders,
            readyOrders,
            shippedOrders,
            lowStockProducts,
            revenue: revenue._sum.totalAmount || 0,
        };
    }

    async getOrders(distributorId: string, status?: string) {
        const where: any = { distributorId };
        if (status) where.status = status;

        return this.prisma.order.findMany({
            where,
            include: {
                client: { include: { user: true } },
                driver: { include: { user: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async acceptOrder(orderId: string, distributorId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, distributorId },
        });

        if (!order) {
            throw new NotFoundException('Buyurtma topilmadi');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'ACCEPTED' },
            include: {
                client: { include: { user: true } },
                items: { include: { product: true } },
            },
        });

        await this.prisma.orderStatusHistory.create({
            data: { orderId, status: 'ACCEPTED' },
        });

        return updatedOrder;
    }

    async rejectOrder(orderId: string, distributorId: string, reason: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, distributorId },
        });

        if (!order) {
            throw new NotFoundException('Buyurtma topilmadi');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'REJECTED', rejectionReason: reason },
        });

        await this.prisma.orderStatusHistory.create({
            data: { orderId, status: 'REJECTED', note: reason },
        });

        return updatedOrder;
    }

    async getStockLogs(distributorId: string) {
        return this.prisma.stockLog.findMany({
            where: { distributorId },
            include: { product: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async updateStock(
        productId: string,
        distributorId: string,
        quantity: number,
        type: 'IN' | 'OUT' | 'ADJUSTMENT',
        note?: string,
    ) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, distributorId },
        });

        if (!product) {
            throw new NotFoundException('Mahsulot topilmadi');
        }

        await this.prisma.stockLog.create({
            data: {
                productId,
                distributorId,
                type,
                quantity,
                note,
            },
        });

        return { success: true };
    }
}
