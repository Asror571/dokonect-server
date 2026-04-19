import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DistributorService {
  constructor(private prisma: PrismaService) {}

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

  // YANGI: Mini Dashboard uchun
  async getProductsDashboard(distributorId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Top 5 eng ko'p sotilgan mahsulotlar
    const topSellingProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          distributorId,
          createdAt: { gte: sevenDaysAgo },
          status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED'] },
        },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProducts = await Promise.all(
      topSellingProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { images: { where: { isCover: true }, take: 1 } },
        });
        return {
          ...product,
          soldQuantity: item._sum.quantity,
          revenue: item._sum.total,
        };
      }),
    );

    // Kam qolgan mahsulotlar
    const lowStockProducts = await this.prisma.inventory.findMany({
      where: {
        product: { distributorId },
        quantity: { lte: this.prisma.inventory.fields.minThreshold },
      },
      include: {
        product: {
          include: { images: { where: { isCover: true }, take: 1 } },
        },
      },
      take: 10,
    });

    // Sekin sotilayotgan mahsulotlar
    const slowMovingProducts = await this.prisma.salesVelocity.findMany({
      where: {
        product: { distributorId },
        status: { in: ['SLOW', 'DEAD'] },
      },
      include: {
        product: {
          include: { images: { where: { isCover: true }, take: 1 } },
        },
      },
      orderBy: { dailyAverage: 'asc' },
      take: 10,
    });

    // Eng ko'p buyurtma qilingan mahsulotlar
    const mostOrderedProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          distributorId,
          createdAt: { gte: sevenDaysAgo },
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const mostOrdered = await Promise.all(
      mostOrderedProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { images: { where: { isCover: true }, take: 1 } },
        });
        return {
          ...product,
          orderCount: item._count.id,
        };
      }),
    );

    return {
      topSellingProducts: topProducts,
      lowStockProducts,
      slowMovingProducts,
      mostOrderedProducts: mostOrdered,
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
    changedBy?: string,
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
        changedBy,
      },
    });

    return { success: true };
  }
}
