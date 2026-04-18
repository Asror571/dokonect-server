import { IsString, IsEmail, IsOptional, IsEnum, MinLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    phone: string;

    @ApiPropertyOptional()
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ enum: Role })
    @IsEnum(Role)
    role: Role;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    storeName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    region?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    companyName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    vehicleType?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    vehicleNumber?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    licenseNumber?: string;
}
