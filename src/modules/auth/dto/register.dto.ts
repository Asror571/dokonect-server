import { IsString, IsEmail, IsOptional, IsEnum, MinLength, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ description: 'To\'liq ism', example: 'Alisher Navoiy' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Telefon raqam', example: '998901234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Email', example: 'alisher@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Parol (minimum 6 ta belgi)', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, description: 'Foydalanuvchi roli' })
  @IsEnum(Role)
  role: Role;

  // CLIENT uchun
  @ApiPropertyOptional({ description: 'Do\'kon nomi (CLIENT uchun)', example: 'Mening Do\'konim' })
  @IsString()
  @IsOptional()
  storeName?: string;

  @ApiPropertyOptional({ description: 'Hudud/Viloyat', example: 'Toshkent' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'Latitude (CLIENT uchun)', example: 41.2995 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude (CLIENT uchun)', example: 69.2401 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lng?: number;

  // DISTRIBUTOR uchun
  @ApiPropertyOptional({ description: 'Kompaniya nomi (DISTRIBUTOR uchun)', example: 'Distribyutor LLC' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Manzil (DISTRIBUTOR uchun)', example: 'Toshkent sh., Chilonzor t.' })
  @IsString()
  @IsOptional()
  address?: string;

  // DRIVER uchun
  @ApiPropertyOptional({ description: 'Transport turi (DRIVER uchun)', example: 'Yengil mashina' })
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional({ description: 'Transport raqami (DRIVER uchun)', example: '01A123BC' })
  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'Haydovchilik guvohnomasi (DRIVER uchun)', example: 'AB1234567' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;
}
