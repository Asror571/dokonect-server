import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  async getWarehouses(distributorId: string) {
    return this.prisma.warehouse.findMany({
      where: { distributorId },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouse(id: string, distributorId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, distributorId },
      include: {
        inventory: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Ombor topilmadi');
    }

    return warehouse;
  }

  async createWarehouse(
    distributorId: string,
    data: {
      name: string;
      address: string;
      region: string;
      managerId?: string;
    },
  ) {
    return this.prisma.warehouse.create({
      data: {
        ...data,
        distributorId,
      },
    });
  }

  async updateWarehouse(
    id: string,
    distributorId: string,
    data: {
      name?: string;
      address?: string;
      region?: string;
      managerId?: string;
      isActive?: boolean;
    },
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, distributorId },
    });

    if (!warehouse) {
      throw new NotFoundException('Ombor topilmadi');
    }

    return this.prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  async deleteWarehouse(id: string, distributorId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, distributorId },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Ombor topilmadi');
    }

    if (warehouse._count.inventory > 0) {
      // Soft delete
      return this.prisma.warehouse.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.warehouse.delete({
      where: { id },
    });
  }
}
