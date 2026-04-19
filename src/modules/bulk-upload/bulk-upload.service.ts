import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class BulkUploadService {
  constructor(private prisma: PrismaService) {}

  async uploadProducts(file: Express.Multer.File, distributorId: string) {
    if (!file) {
      throw new BadRequestException('Fayl yuklanmadi');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (const row of data as any[]) {
        try {
          // Validate required fields
          if (!row.name || !row.sku || !row.wholesalePrice) {
            results.failed++;
            results.errors.push({
              row,
              error: "Majburiy maydonlar to'ldirilmagan",
            });
            continue;
          }

          // Check if SKU exists
          const existing = await this.prisma.product.findUnique({
            where: { sku: row.sku },
          });

          if (existing) {
            // Update existing product
            await this.prisma.product.update({
              where: { sku: row.sku },
              data: {
                name: row.name,
                description: row.description,
                wholesalePrice: parseFloat(row.wholesalePrice),
                retailPrice: row.retailPrice ? parseFloat(row.retailPrice) : null,
                costPrice: row.costPrice ? parseFloat(row.costPrice) : null,
                unit: row.unit || 'pcs',
                status: row.status || 'ACTIVE',
              },
            });
          } else {
            // Create new product
            await this.prisma.product.create({
              data: {
                distributorId,
                name: row.name,
                sku: row.sku,
                description: row.description,
                wholesalePrice: parseFloat(row.wholesalePrice),
                retailPrice: row.retailPrice ? parseFloat(row.retailPrice) : null,
                costPrice: row.costPrice ? parseFloat(row.costPrice) : null,
                unit: row.unit || 'pcs',
                status: row.status || 'ACTIVE',
              },
            });
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new BadRequestException("Excel faylni o'qishda xatolik: " + error.message);
    }
  }

  async uploadInventory(file: Express.Multer.File, distributorId: string) {
    if (!file) {
      throw new BadRequestException('Fayl yuklanmadi');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (const row of data as any[]) {
        try {
          if (!row.sku || !row.warehouseId || row.quantity === undefined) {
            results.failed++;
            results.errors.push({
              row,
              error: "Majburiy maydonlar to'ldirilmagan",
            });
            continue;
          }

          // Find product
          const product = await this.prisma.product.findFirst({
            where: {
              sku: row.sku,
              distributorId,
            },
          });

          if (!product) {
            results.failed++;
            results.errors.push({
              row,
              error: 'Mahsulot topilmadi',
            });
            continue;
          }

          // Find or create inventory
          const inventory = await this.prisma.inventory.findFirst({
            where: {
              productId: product.id,
              warehouseId: row.warehouseId,
              variantId: row.variantId || null,
            },
          });

          if (inventory) {
            await this.prisma.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: parseInt(row.quantity),
                minThreshold: row.minThreshold ? parseInt(row.minThreshold) : 5,
              },
            });
          } else {
            await this.prisma.inventory.create({
              data: {
                productId: product.id,
                warehouseId: row.warehouseId,
                variantId: row.variantId || null,
                quantity: parseInt(row.quantity),
                minThreshold: row.minThreshold ? parseInt(row.minThreshold) : 5,
              },
            });
          }

          // Log the change
          await this.prisma.stockLog.create({
            data: {
              productId: product.id,
              distributorId,
              type: 'ADJUSTMENT',
              quantity: parseInt(row.quantity),
              note: 'Bulk upload',
              warehouseId: row.warehouseId,
            },
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw new BadRequestException("Excel faylni o'qishda xatolik: " + error.message);
    }
  }
}
