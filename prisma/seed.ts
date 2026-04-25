import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Hash password: 123456
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Admin - +998900000000
    const admin = await prisma.user.upsert({
        where: { phone: '+998900000000' },
        update: {},
        create: {
            name: 'Admin',
            phone: '+998900000000',
            email: 'admin@dokonect.uz',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Admin created:', admin.phone);

    // 2. Distributor - +998901234567
    const distributor = await prisma.user.upsert({
        where: { phone: '+998901234567' },
        update: {},
        create: {
            name: 'Distribyutor Test',
            phone: '+998901234567',
            email: 'distributor@test.uz',
            password: hashedPassword,
            role: 'DISTRIBUTOR',
            status: 'ACTIVE',
        },
    });

    await prisma.distributor.upsert({
        where: { userId: distributor.id },
        update: {},
        create: {
            userId: distributor.id,
            companyName: 'Test Distribyutor',
            address: 'Toshkent, Chilonzor',
            isVerified: true,
        },
    });
    console.log('✅ Distributor created:', distributor.phone);

    // 3. Client (Do'kon egasi) - +998901234500
    const client = await prisma.user.upsert({
        where: { phone: '+998901234500' },
        update: {},
        create: {
            name: "Do'kon Egasi",
            phone: '+998901234500',
            email: 'client@test.uz',
            password: hashedPassword,
            role: 'CLIENT',
            status: 'ACTIVE',
        },
    });

    await prisma.client.upsert({
        where: { userId: client.id },
        update: {},
        create: {
            userId: client.id,
            storeName: 'Test Do\'kon',
            region: 'Toshkent',
        },
    });
    console.log('✅ Client (Do\'kon egasi) created:', client.phone);

    console.log('🎉 Seeding completed!');
    console.log('\n📋 Test hisoblar:');
    console.log('  Admin:        +998900000000 / 123456');
    console.log('  Distribyutor: +998901234567 / 123456');
    console.log('  Do\'kon egasi: +998901234500 / 123456');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
