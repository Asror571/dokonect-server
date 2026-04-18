import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty()
    @IsString()
    phone: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password: string;
}
