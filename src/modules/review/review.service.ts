import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(
    userId: string,
    clientId: string,
    orderId: string,
    productId: string,
    rating: number,
    comment?: string,
    images?: any,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, clientId, status: 'DELIVERED' },
    });

    if (!order) {
      throw new BadRequestException('Buyurtma topilmadi yoki yetkazilmagan');
    }

    const existingReview = await this.prisma.review.findUnique({
      where: { orderId },
    });

    if (existingReview) {
      throw new BadRequestException('Bu buyurtma uchun sharh allaqachon mavjud');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        clientId,
        orderId,
        productId,
        rating,
        comment,
        images,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    return review;
  }

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replyToReview(reviewId: string, userId: string, comment: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Sharh topilmadi');
    }

    return this.prisma.reviewReply.create({
      data: {
        reviewId,
        userId,
        comment,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
    });

    if (reviews.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      // Note: Product model doesn't have rating field in schema,
      // but distributor does. This is just for reference.
    }
  }
}
