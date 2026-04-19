import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(distributorId: string, warehouseId?: string) {
    const where: any = {
      product: { distributorId },
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    return this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            images: { where: { isCover: true }, take: 1 },
          },
        },
        variant: true,
        warehouse: true,
      },
      orderBy: { lastUpdated: 'desc' },
    });
  }

  async updateInventory(
    inventoryId: string,
    distributorId: string,
    quantity: number,
    type: 'IN' | 'OUT' | 'ADJUSTMENT',
  ) {
    const inventory = await this.prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        product: { distributorId },
      },
      include: { product: true },
    });

    if (!inventory) {
      throw new NotFoundException('Inventar topilmadi');
    }

    let newQuantity = inventory.quantity;
    if (type === 'IN') {
      newQuantity += quantity;
    } else if (type === 'OUT') {
      if (inventory.quantity < quantity) {
        throw new BadRequestException("Yetarli miqdor yo'q");
      }
      newQuantity -= quantity;
    } else {
      newQuantity = quantity;
    }

    const updated = await this.prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity: newQuantity },
    });

    // Log the change
    await this.prisma.stockLog.create({
      data: {
        productId: inventory.productId,
        distributorId,
        type,
        quantity,
        warehouseId: inventory.warehouseId,
        variantId: inventory.variantId,
      },
    });

    return updated;
  }

  async getLowStockItems(distributorId: string) {
    return this.prisma.inventory.findMany({
      where: {
        product: { distributorId },
        quantity: {
          lte: this.prisma.inventory.fields.minThreshold,
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });
  }

  async transferStock(
    sourceWarehouseId: string,
    destWarehouseId: string,
    productId: string,
    variantId: string | null,
    quantity: number,
    distributorId: string,
  ) {
    // Check source inventory
    const sourceInventory = await this.prisma.inventory.findFirst({
      where: {
        warehouseId: sourceWarehouseId,
        productId,
        variantId,
        product: { distributorId },
      },
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      throw new BadRequestException("Yetarli miqdor yo'q");
    }

    // Create transfer record
    const transfer = await this.prisma.warehouseTransfer.create({
      data: {
        sourceWarehouseId,
        destWarehouseId,
        productId,
        variantId,
        quantity,
        status: 'PENDING',
      },
    });

    return transfer;
  }

  async completeTransfer(transferId: string, distributorId: string) {
    const transfer = await this.prisma.warehouseTransfer.findFirst({
      where: {
        id: transferId,
        sourceWarehouse: {
          distributorId,
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer topilmadi');
    }

    if (transfer.status !== 'PENDING') {
      throw new BadRequestException('Transfer allaqachon bajarilgan');
    }

    // Update source inventory
    const sourceInventory = await this.prisma.inventory.findFirst({
      where: {
        warehouseId: transfer.sourceWarehouseId,
        productId: transfer.productId,
        variantId: transfer.variantId,
      },
    });

    if (sourceInventory) {
      await this.prisma.inventory.update({
        where: { id: sourceInventory.id },
        data: { quantity: sourceInventory.quantity - transfer.quantity },
      });
    }

    // Update destination inventory
    const destInventory = await this.prisma.inventory.findFirst({
      where: {
        warehouseId: transfer.destWarehouseId,
        productId: transfer.productId,
        variantId: transfer.variantId,
      },
    });

    if (destInventory) {
      await this.prisma.inventory.update({
        where: { id: destInventory.id },
        data: { quantity: destInventory.quantity + transfer.quantity },
      });
    } else {
      await this.prisma.inventory.create({
        data: {
          warehouseId: transfer.destWarehouseId,
          productId: transfer.productId,
          variantId: transfer.variantId,
          quantity: transfer.quantity,
        },
      });
    }

    // Update transfer status
    return this.prisma.warehouseTransfer.update({
      where: { id: transferId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async getTransfers(distributorId: string) {
    return this.prisma.warehouseTransfer.findMany({
      where: {
        sourceWarehouse: { distributorId },
      },
      include: {
        sourceWarehouse: true,
        destWarehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
