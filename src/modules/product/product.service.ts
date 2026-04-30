import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { ProductAnalyticsService } from './product-analytics.service';
import { ProductHistoryService } from './product-history.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: ProductAnalyticsService,
    private historyService: ProductHistoryService,
  ) { }

  async findAll(query: ProductQueryDto) {
    const {
      search,
      category,
      page = 1,
      limit = 20,
      distributorId,
      minPrice,
      maxPrice,
      stockStatus,
      velocityStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
    };

    if (distributorId) {
      where.distributorId = distributorId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    // Narx oralig'i
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.wholesalePrice = {};
      if (minPrice !== undefined) where.wholesalePrice.gte = minPrice;
      if (maxPrice !== undefined) where.wholesalePrice.lte = maxPrice;
    }

    // Stock holati
    if (stockStatus) {
      if (stockStatus === 'in_stock') {
        where.inventory = {
          some: {
            quantity: { gt: 0 },
          },
        };
      } else if (stockStatus === 'low_stock') {
        where.inventory = {
          some: {
            quantity: {
              lte: this.prisma.inventory.fields.minThreshold,
              gt: 0,
            },
          },
        };
      } else if (stockStatus === 'out_of_stock') {
        where.inventory = {
          every: {
            quantity: 0,
          },
        };
      }
    }

    // Sotilish tezligi
    if (velocityStatus) {
      where.salesVelocity = {
        status: velocityStatus.toUpperCase(),
      };
    }

    // Sort
    let orderBy: any = {};
    if (sortBy === 'price') {
      orderBy = { wholesalePrice: sortOrder };
    } else if (sortBy === 'stock') {
      orderBy = { inventory: { _count: sortOrder } };
    } else if (sortBy === 'sales') {
      orderBy = { salesVelocity: { dailyAverage: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          images: true,
          category: true,
          brand: true,
          distributor: {
            select: {
              id: true,
              companyName: true,
              logo: true,
              rating: true,
            },
          },
          inventory: {
            select: {
              quantity: true,
              reserved: true,
              warehouse: true,
            },
          },
          salesVelocity: true,
        },
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Har bir mahsulot uchun available stock hisoblash
    const productsWithStats = products.map((product) => {
      const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const totalReserved = product.inventory.reduce((sum, inv) => sum + inv.reserved, 0);
      const available = totalStock - totalReserved;

      // Status badge
      let badge = 'NORMAL';
      if (product.salesVelocity) {
        if (product.salesVelocity.status === 'FAST') badge = 'TOP';
        else if (product.salesVelocity.status === 'DEAD') badge = 'DEAD';
      }
      if (totalStock <= 5) badge = 'LOW';

      return {
        ...product,
        totalStock,
        available,
        badge,
        dailySales: product.salesVelocity?.dailyAverage || 0,
      };
    });

    return {
      products: productsWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
        brand: true,
        variants: true,
        distributor: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            rating: true,
            phone: true,
            address: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        inventory: {
          include: {
            warehouse: true,
          },
        },
        salesVelocity: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    // Analytics va history qo'shish
    const [analytics, history] = await Promise.all([
      this.analyticsService.getProductAnalytics(id, '7d'),
      this.historyService.getProductHistory(id),
    ]);

    return {
      ...product,
      analytics,
      history,
    };
  }

  async getCategories(distributorId?: string) {
    const where = distributorId ? { distributorId } : {};

    return this.prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async create(distributorId: string, dto: CreateProductDto) {
    try {
      const { images, variants, initialStock, ...productData } = dto as any;

      // Bo'sh SKU — avtomatik yaratish
      const sku = productData.sku?.trim()
        ? productData.sku.trim()
        : `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const product = await this.prisma.product.create({
        data: {
          name:          productData.name,
          sku,
          description:   productData.description   || null,
          wholesalePrice: Number(productData.wholesalePrice),
          retailPrice:   productData.retailPrice   ? Number(productData.retailPrice)  : null,
          costPrice:     productData.costPrice     ? Number(productData.costPrice)    : null,
          unit:          productData.unit          || 'dona',
          status:        productData.status        || 'ACTIVE',
          youtubeUrl:    productData.youtubeUrl    || null,
          discountType:  productData.discountType  || null,
          discountValue: productData.discountValue ? Number(productData.discountValue) : null,
          distributor:   { connect: { id: distributorId } },
          category:      productData.categoryId ? { connect: { id: productData.categoryId } } : undefined,
          brand:         productData.brandId    ? { connect: { id: productData.brandId } }    : undefined,
          images: images?.length
            ? {
              create: images.map((url: string, index: number) => ({
                url,
                order: index,
                isCover: index === 0,
              })),
            }
            : undefined,
          variants: variants?.length
            ? { create: variants }
            : undefined,
        },
        include: {
          images: true,
          variants: true,
        },
      });

      // Sales velocity ni hisoblash
      await this.analyticsService.calculateSalesVelocity(product.id);

      // Default warehouse topish va inventory yaratish
      const defaultWarehouse = await this.prisma.warehouse.findFirst({
        where: { distributorId },
      });

      if (defaultWarehouse) {
        const stockQuantity = Number(initialStock) || 0;
        await this.prisma.inventory.create({
          data: {
            productId: product.id,
            warehouseId: defaultWarehouse.id,
            quantity: stockQuantity,
            minThreshold: 10,
          },
        });
      }

      return product;
    } catch (error: any) {
      console.error('Product create error:', error);
      throw new Error(error.message || 'Mahsulot yaratishda xatolik');
    }
  }

  async update(id: string, distributorId: string, dto: UpdateProductDto, changedBy?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, distributorId },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { images, variants, ...productData } = dto;

    // Narx o'zgarishini qayd qilish
    if (dto.wholesalePrice && dto.wholesalePrice !== product.wholesalePrice) {
      await this.historyService.logPriceChange(
        id,
        product.wholesalePrice,
        dto.wholesalePrice,
        'WHOLESALE',
        changedBy || 'system',
        'Manual update',
      );
    }

    if (dto.retailPrice && dto.retailPrice !== product.retailPrice) {
      await this.historyService.logPriceChange(
        id,
        product.retailPrice || 0,
        dto.retailPrice,
        'RETAIL',
        changedBy || 'system',
        'Manual update',
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: productData,
      include: {
        images: true,
        variants: true,
      },
    });
  }

  async remove(id: string, distributorId: string) {
    const where: any = { id };
    if (distributorId) where.distributorId = distributorId;

    const product = await this.prisma.product.findFirst({ where });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    try {
      // Avval bog'liq inventory va boshqa cascade bo'lmagan yozuvlarni o'chirish
      await this.prisma.inventory.deleteMany({ where: { productId: id } });
      await this.prisma.stockLog.deleteMany({ where: { productId: id } });
      await this.prisma.priceHistory.deleteMany({ where: { productId: id } });
      await this.prisma.productAlert.deleteMany({ where: { productId: id } });
      await this.prisma.salesVelocity.deleteMany({ where: { productId: id } });
      await this.prisma.priceRule.deleteMany({ where: { productId: id } });
      await this.prisma.bulkRule.deleteMany({ where: { productId: id } });

      await this.prisma.product.delete({ where: { id } });
    } catch (error: any) {
      // Buyurtmalarda ishlatilgan mahsulotni o'chirib bo'lmaydi — arxivlaymiz
      if (error.code === 'P2003' || error.code === 'P2014') {
        await this.prisma.product.update({
          where: { id },
          data: { status: 'DRAFT' },
        });
        return { message: "Mahsulot arxivlandi (buyurtmalarda ishlatilgan)" };
      }
      throw error;
    }

    return { message: "Mahsulot o'chirildi" };
  }
}
