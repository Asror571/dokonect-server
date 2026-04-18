import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';

@Injectable()
export class ProductService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: ProductQueryDto) {
        const { search, category, page = 1, limit = 20, distributorId } = query;
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
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            products,
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
            },
        });

        if (!product) {
            throw new NotFoundException('Mahsulot topilmadi');
        }

        return product;
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
        const { images, variants, ...productData } = dto;

        const product = await this.prisma.product.create({
            data: {
                ...productData,
                distributorId,
                images: images
                    ? {
                        create: images.map((url, index) => ({
                            url,
                            order: index,
                            isCover: index === 0,
                        })),
                    }
                    : undefined,
                variants: variants
                    ? {
                        create: variants,
                    }
                    : undefined,
            },
            include: {
                images: true,
                variants: true,
            },
        });

        return product;
    }

    async update(id: string, distributorId: string, dto: UpdateProductDto) {
        const product = await this.prisma.product.findFirst({
            where: { id, distributorId },
        });

        if (!product) {
            throw new NotFoundException('Mahsulot topilmadi');
        }

        const { images, variants, ...productData } = dto;

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
        const product = await this.prisma.product.findFirst({
            where: { id, distributorId },
        });

        if (!product) {
            throw new NotFoundException('Mahsulot topilmadi');
        }

        // Soft delete
        await this.prisma.product.update({
            where: { id },
            data: { status: 'OUT_OF_STOCK' },
        });

        return { message: 'Mahsulot o\'chirildi' };
    }
}
