import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class BrandService {
    constructor(private prisma: PrismaService) { }

    async getBrands(distributorId: string) {
        return this.prisma.brand.findMany({
            where: { distributorId },
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getBrand(id: string, distributorId: string) {
        const brand = await this.prisma.brand.findFirst({
            where: { id, distributorId },
            include: {
                products: {
                    take: 10,
                    include: {
                        images: { where: { isCover: true }, take: 1 },
                    },
                },
            },
        });

        if (!brand) {
            throw new NotFoundException('Brend topilmadi');
        }

        return brand;
    }

    async createBrand(
        distributorId: string,
        data: {
            name: string;
            logo?: string;
        },
    ) {
        const slug = slugify(data.name, { lower: true, strict: true });

        const existing = await this.prisma.brand.findUnique({
            where: {
                distributorId_slug: {
                    distributorId,
                    slug,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Bu nom bilan brend mavjud');
        }

        return this.prisma.brand.create({
            data: {
                ...data,
                slug,
                distributorId,
            },
        });
    }

    async updateBrand(
        id: string,
        distributorId: string,
        data: {
            name?: string;
            logo?: string;
        },
    ) {
        const brand = await this.prisma.brand.findFirst({
            where: { id, distributorId },
        });

        if (!brand) {
            throw new NotFoundException('Brend topilmadi');
        }

        const updateData: any = { ...data };

        if (data.name) {
            updateData.slug = slugify(data.name, { lower: true, strict: true });
        }

        return this.prisma.brand.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteBrand(id: string, distributorId: string) {
        const brand = await this.prisma.brand.findFirst({
            where: { id, distributorId },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!brand) {
            throw new NotFoundException('Brend topilmadi');
        }

        if (brand._count.products > 0) {
            throw new BadRequestException('Brendda mahsulotlar mavjud');
        }

        return this.prisma.brand.delete({
            where: { id },
        });
    }
}
