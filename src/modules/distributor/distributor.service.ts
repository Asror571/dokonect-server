import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DistributorService {
  constructor(private prisma: PrismaService) { }

  async getDashboard(distributorId: string | null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderWhere: any = {};
    if (distributorId) {
      orderWhere.distributorId = distributorId;
    }

    const productWhere: any = {};
    if (distributorId) {
      productWhere.distributorId = distributorId;
    }

    const [incomingOrders, readyOrders, shippedOrders, lowStockProducts, revenue] =
      await Promise.all([
        this.prisma.order.count({
          where: { ...orderWhere, status: 'NEW' },
        }),
        this.prisma.order.count({
          where: { ...orderWhere, status: 'ACCEPTED' },
        }),
        this.prisma.order.count({
          where: {
            ...orderWhere,
            status: { in: ['PICKED', 'IN_TRANSIT', 'DELIVERED'] },
            createdAt: { gte: today },
          },
        }),
        this.prisma.product.count({
          where: productWhere,
        }),
        this.prisma.order.aggregate({
          where: {
            ...orderWhere,
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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        distributor: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  async updateProfile(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { distributor: true },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });

    // Update distributor
    if (user.distributor && data.companyName) {
      await this.prisma.distributor.update({
        where: { id: user.distributor.id },
        data: {
          companyName: data.companyName,
          address: data.address,
          phone: data.phone,
          description: data.description,
        },
      });
    }

    return { success: true, user: updatedUser };
  }

  // YANGI: Mini Dashboard uchun
  async getProductsDashboard(distributorId: string | null) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orderWhere: any = {
      createdAt: { gte: sevenDaysAgo },
      status: { in: ['DELIVERED', 'IN_TRANSIT', 'PICKED'] },
    };
    if (distributorId) {
      orderWhere.distributorId = distributorId;
    }

    const productWhere: any = {};
    if (distributorId) {
      productWhere.distributorId = distributorId;
    }

    // Top 5 eng ko'p sotilgan mahsulotlar
    const topSellingProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: orderWhere,
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
        product: productWhere,
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
        product: productWhere,
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
          ...orderWhere,
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

  async getOrders(distributorId: string | null, status?: string) {
    const where: any = {};
    if (distributorId) {
      where.distributorId = distributorId;
    }
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

  async getStockLogs(distributorId: string | null) {
    const where: any = {};
    if (distributorId) {
      where.distributorId = distributorId;
    }

    return this.prisma.stockLog.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getInventory(distributorId: string | null, warehouseId?: string) {
    const where: any = {};

    if (distributorId) {
      where.product = { distributorId };
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const inventory = await this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            images: { where: { isCover: true }, take: 1 },
            category: true,
          },
        },
        warehouse: true,
      },
    });

    return { success: true, data: { inventory } };
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

  async getDrivers(distributorId: string | null) {
    // Get all drivers (for now, return all drivers in the system)
    // In production, you might want to filter by distributor's region or assigned drivers
    const drivers = await this.prisma.driver.findMany({
      include: {
        user: true,
        _count: {
          select: {
            orders: true,
            deliveries: true,
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    return { success: true, data: drivers };
  }

  async createDriver(distributorId: string, data: any) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });

    // Create driver profile
    const driver = await this.prisma.driver.create({
      data: {
        userId: user.id,
        vehicleType: data.vehicleType,
        vehicleNumber: data.plateNumber || '',
        licenseNumber: data.licenseNumber || '',
      },
    });

    return { success: true, data: { ...driver, user } };
  }

  async updateDriver(driverId: string, distributorId: string, data: any) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Haydovchi topilmadi');
    }

    // Update user
    await this.prisma.user.update({
      where: { id: driver.userId },
      data: {
        name: data.name,
        phone: data.phone,
        status: data.status,
      },
    });

    // Update driver
    const updatedDriver = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        vehicleType: data.vehicleType,
        vehicleNumber: data.plateNumber,
        status: data.status,
      },
      include: { user: true },
    });

    // Update password if provided
    if (data.password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await this.prisma.user.update({
        where: { id: driver.userId },
        data: { password: hashedPassword },
      });
    }

    return { success: true, data: updatedDriver };
  }
}
