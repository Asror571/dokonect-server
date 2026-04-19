import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProductQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  distributorId?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  // Yangi filterlar
  @ApiPropertyOptional({ description: 'Minimal narx' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maksimal narx' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['in_stock', 'low_stock', 'out_of_stock'] })
  @IsString()
  @IsOptional()
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';

  @ApiPropertyOptional({ enum: ['fast', 'medium', 'slow', 'dead'] })
  @IsString()
  @IsOptional()
  velocityStatus?: 'fast' | 'medium' | 'slow' | 'dead';

  @ApiPropertyOptional({ enum: ['createdAt', 'price', 'stock', 'sales'], default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'price' | 'stock' | 'sales' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
