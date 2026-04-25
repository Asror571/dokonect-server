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

    const distributorProfile = await prisma.distributor.upsert({
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

    // 2.1 Warehouse yaratish
    const warehouse = await prisma.warehouse.upsert({
        where: { id: 'default-warehouse-id' },
        update: {},
        create: {
            id: 'default-warehouse-id',
            distributorId: distributorProfile.id,
            name: 'Asosiy ombor',
            address: 'Toshkent, Chilonzor tumani',
            region: 'Toshkent',
            isActive: true,
        },
    });
    console.log('✅ Warehouse created:', warehouse.name);

    // 2.2 Kategoriya yaratish
    const category = await prisma.category.upsert({
        where: { id: 'default-category-id' },
        update: {},
        create: {
            id: 'default-category-id',
            distributorId: distributorProfile.id,
            name: 'Ichimliklar',
            slug: 'ichimliklar',
        },
    });
    console.log('✅ Category created:', category.name);

    // 2.3 Test mahsulotlar yaratish
    const products = [
        { name: 'Coca Cola 1.5L', sku: 'COKE-1.5L', price: 12000 },
        { name: 'Pepsi 1L', sku: 'PEPSI-1L', price: 10000 },
        { name: 'Fanta 0.5L', sku: 'FANTA-0.5L', price: 6000 },
    ];

    for (const prod of products) {
        const product = await prisma.product.upsert({
            where: { sku: prod.sku },
            update: {},
            create: {
                distributorId: distributorProfile.id,
                categoryId: category.id,
                name: prod.name,
                sku: prod.sku,
                wholesalePrice: prod.price,
                retailPrice: prod.price * 1.2,
                status: 'ACTIVE',
                unit: 'dona',
            },
        });

        // Inventory yaratish
        await prisma.inventory.upsert({
            where: {
                productId_variantId_warehouseId: {
                    productId: product.id,
                    variantId: null,
                    warehouseId: warehouse.id,
                },
            },
            update: {},
            create: {
                productId: product.id,
                warehouseId: warehouse.id,
                quantity: 100,
                minThreshold: 10,
            },
        });

        console.log(`✅ Product created: ${product.name}`);
    }

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
