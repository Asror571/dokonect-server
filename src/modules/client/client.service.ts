import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientService {
    constructor(private prisma: PrismaService) { }

    async getDashboard(clientId: string) {
        const [activeOrder, recentOrders, client] = await Promise.all([
            this.prisma.order.findFirst({
                where: {
                    clientId,
                    status: { in: ['NEW', 'ACCEPTED', 'ASSIGNED', 'PICKED', 'IN_TRANSIT'] },
                },
                include: {
                    distributor: true,
                    driver: { include: { user: true } },
                    items: { include: { product: true } },
                },
            }),
            this.prisma.order.findMany({
                where: { clientId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    distributor: true,
                    items: { include: { product: true } },
                },
            }),
            this.prisma.client.findUnique({
                where: { id: clientId },
                include: { user: true },
            }),
        ]);

        return {
            activeOrder,
            recentOrders,
            client,
        };
    }

    async getProducts(clientId: string, query: any) {
        const { categoryId, search, distributorId, brandId, minPrice, maxPrice, sort } = query;

        const where: any = {
            status: 'ACTIVE',
            distributor: { isVerified: true },
        };

        if (categoryId) where.categoryId = categoryId;
        if (brandId) where.brandId = brandId;
        if (distributorId) where.distributorId = distributorId;

        if (minPrice || maxPrice) {
            where.wholesalePrice = {
                ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
                ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.product.findMany({
            where,
            include: {
                distributor: { select: { id: true, companyName: true, phone: true } },
                category: true,
                brand: true,
                images: { where: { isCover: true }, take: 1 },
                bulkRules: true,
                priceRules: { where: { clientId } },
            },
            orderBy:
                sort === 'price_asc'
                    ? { wholesalePrice: 'asc' }
                    : sort === 'price_desc'
                        ? { wholesalePrice: 'desc' }
                        : { createdAt: 'desc' },
        });
    }

    async getDistributors(clientId: string, region?: string, search?: string) {
        const where: any = { isVerified: true };
        if (search) {
            where.companyName = { contains: search, mode: 'insensitive' };
        }

        const distributors = await this.prisma.distributor.findMany({
            where,
            include: {
                user: { select: { name: true, avatar: true } },
                storeLinks: {
                    where: { storeOwnerId: clientId },
                },
            },
        });

        return distributors.map((d) => ({
            id: d.id,
            companyName: d.companyName,
            logo: d.logo,
            address: d.address,
            rating: d.rating,
            isVerified: d.isVerified,
            linkStatus: d.storeLinks[0]?.status || 'NONE',
        }));
    }

    async connectDistributor(clientId: string, distributorId: string) {
        const existingLink = await this.prisma.storeDistributorLink.findUnique({
            where: {
                storeOwnerId_distributorId: {
                    storeOwnerId: clientId,
                    distributorId,
                },
            },
        });

        if (existingLink) {
            throw new BadRequestException('Ulanish so\'rovi allaqachon mavjud');
        }

        return this.prisma.storeDistributorLink.create({
            data: {
                storeOwnerId: clientId,
                distributorId,
                status: 'PENDING',
            },
        });
    }

    async getFinanceSummary(clientId: string) {
        const [debts, totalSpent] = await Promise.all([
            this.prisma.debt.findMany({
                where: { clientId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } },
            }),
            this.prisma.order.aggregate({
                where: { clientId, status: 'DELIVERED' },
                _sum: { totalAmount: true },
            }),
        ]);

        const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

        const now = new Date();
        const overdueDebt = debts
            .filter((d) => d.dueDate && d.dueDate < now)
            .reduce((sum, d) => sum + d.remainingAmount, 0);

        return {
            totalDebt,
            overdueDebt,
            totalSpent: totalSpent._sum.totalAmount || 0,
            activeDebtsCount: debts.length,
        };
    }

    async getOrderTracking(orderId: string, clientId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, clientId },
            include: {
                distributor: true,
                driver: { include: { user: true } },
                items: { include: { product: true } },
                statusHistory: { orderBy: { timestamp: 'asc' } },
                delivery: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Buyurtma topilmadi');
        }

        return order;
    }

    async getOrderStats(clientId: string) {
        const stats = await this.prisma.order.groupBy({
            by: ['status'],
            where: { clientId },
            _count: { id: true },
            _sum: { totalAmount: true },
        });

        const formatted = stats.reduce((acc: any, stat) => {
            acc[stat.status] = {
                count: stat._count.id,
                total: stat._sum.totalAmount || 0,
            };
            return acc;
        }, {});

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayStats = await this.prisma.order.aggregate({
            where: {
                clientId,
                createdAt: { gte: today },
            },
            _count: { id: true },
            _sum: { totalAmount: true },
        });

        return {
            byStatus: formatted,
            today: {
                count: todayStats._count.id,
                total: todayStats._sum.totalAmount || 0,
            },
        };
    }

    async rateDelivery(orderId: string, clientId: string, rating: number, comment?: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, clientId, status: 'DELIVERED' },
        });

        if (!order || !order.driverId) {
            throw new BadRequestException('Bu buyurtmani baholab bo\'lmaydi');
        }

        const deliveryRating = await this.prisma.deliveryRating.create({
            data: {
                clientId,
                driverId: order.driverId,
                orderId,
                rating,
                comment,
            },
        });

        // Update driver rating
        const allRatings = await this.prisma.deliveryRating.findMany({
            where: { driverId: order.driverId },
        });

        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

        await this.prisma.driver.update({
            where: { id: order.driverId },
            data: { rating: avgRating },
        });

        return deliveryRating;
    }
}
