import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

class OrderItemDto {
    @ApiProperty()
    @IsString()
    productId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    variantId?: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty()
    @IsString()
    distributorId: string;

    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty()
    deliveryAddress: any;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    deliveryTimeSlot?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    deliveryFee?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiPropertyOptional({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    @IsOptional()
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    dueDate?: string;
}
