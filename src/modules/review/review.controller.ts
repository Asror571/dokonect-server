import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
    constructor(private reviewService: ReviewService) { }

    @Get('products/:productId')
    @ApiOperation({ summary: 'Mahsulot sharhlari' })
    getProductReviews(@Param('productId') productId: string) {
        return this.reviewService.getProductReviews(productId);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Sharh qoldirish' })
    createReview(
        @CurrentUser() user: any,
        @Body()
        body: {
            orderId: string;
            productId: string;
            rating: number;
            comment?: string;
            images?: any;
        },
    ) {
        return this.reviewService.createReview(
            user.id,
            user.client.id,
            body.orderId,
            body.productId,
            body.rating,
            body.comment,
            body.images,
        );
    }

    @Post(':reviewId/reply')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Sharhga javob berish' })
    replyToReview(
        @Param('reviewId') reviewId: string,
        @CurrentUser('id') userId: string,
        @Body('comment') comment: string,
    ) {
        return this.reviewService.replyToReview(reviewId, userId, comment);
    }
}
