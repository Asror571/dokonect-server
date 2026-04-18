import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ phone: dto.phone }, { email: dto.email }],
            },
        });

        if (existingUser) {
            throw new ConflictException('Phone yoki email allaqachon mavjud');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                phone: dto.phone,
                email: dto.email,
                password: hashedPassword,
                role: dto.role,
            },
        });

        // Create related profile based on role
        if (dto.role === 'CLIENT') {
            await this.prisma.client.create({
                data: {
                    userId: user.id,
                    storeName: dto.storeName,
                    region: dto.region,
                },
            });
        } else if (dto.role === 'DISTRIBUTOR') {
            await this.prisma.distributor.create({
                data: {
                    userId: user.id,
                    companyName: dto.companyName || 'Company',
                    address: dto.address || '',
                },
            });
        } else if (dto.role === 'DRIVER') {
            await this.prisma.driver.create({
                data: {
                    userId: user.id,
                    vehicleType: dto.vehicleType || '',
                    vehicleNumber: dto.vehicleNumber || '',
                    licenseNumber: dto.licenseNumber || '',
                },
            });
        }

        const token = this.generateToken(user.id, user.role);

        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });

        if (!user) {
            throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
        }

        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedException('Akkaunt faol emas');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        const token = this.generateToken(user.id, user.role);

        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                client: true,
                distributor: true,
                driver: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Foydalanuvchi topilmadi');
        }

        return this.sanitizeUser(user);
    }

    private generateToken(userId: string, role: string): string {
        return this.jwtService.sign({ sub: userId, role });
    }

    private sanitizeUser(user: any) {
        const { password, refreshToken, ...sanitized } = user;
        return sanitized;
    }
}
