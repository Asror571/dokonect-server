import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class CategoryService {
    constructor(private prisma: PrismaService) { }

    async getCategories(distributorId: string) {
        return this.prisma.category.findMany({
            where: { distributorId },
            include: {
                parent: true,
                children: true,
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { order: 'asc' },
        });
    }

    async getCategory(id: string, distributorId: string) {
        const category = await this.prisma.category.findFirst({
            where: { id, distributorId },
            include: {
                parent: true,
                children: true,
                products: {
                    take: 10,
                    include: {
                        images: { where: { isCover: true }, take: 1 },
                    },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Kategoriya topilmadi');
        }

        return category;
    }

    async createCategory(
        distributorId: string,
        data: {
            name: string;
            parentId?: string;
            image?: string;
            icon?: string;
            order?: number;
        },
    ) {
        const slug = slugify(data.name, { lower: true, strict: true });

        // Check if slug exists
        const existing = await this.prisma.category.findUnique({
            where: {
                distributorId_slug: {
                    distributorId,
                    slug,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Bu nom bilan kategoriya mavjud');
        }

        return this.prisma.category.create({
            data: {
                ...data,
                slug,
                distributorId,
            },
        });
    }

    async updateCategory(
        id: string,
        distributorId: string,
        data: {
            name?: string;
            parentId?: string;
            image?: string;
            icon?: string;
            order?: number;
        },
    ) {
        const category = await this.prisma.category.findFirst({
            where: { id, distributorId },
        });

        if (!category) {
            throw new NotFoundException('Kategoriya topilmadi');
        }

        const updateData: any = { ...data };

        if (data.name) {
            updateData.slug = slugify(data.name, { lower: true, strict: true });
        }

        return this.prisma.category.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteCategory(id: string, distributorId: string) {
        const category = await this.prisma.category.findFirst({
            where: { id, distributorId },
            include: {
                _count: {
                    select: { products: true, children: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Kategoriya topilmadi');
        }

        if (category._count.products > 0) {
            throw new BadRequestException('Kategoriyada mahsulotlar mavjud');
        }

        if (category._count.children > 0) {
            throw new BadRequestException('Kategoriyada sub-kategoriyalar mavjud');
        }

        return this.prisma.category.delete({
            where: { id },
        });
    }
}
