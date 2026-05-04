# Buyurtma Raqamlash Tizimi

## O'rnatish

Buyurtmalarga avtomatik raqam berish uchun quyidagi buyruqlarni bajaring:

### 1. Prisma Generate
```bash
cd nest-backend
npx prisma generate
```

### 2. Migration Qo'llash
```bash
npx prisma migrate dev --name add_order_number
```

Agar migration faylini qo'lda qo'llash kerak bo'lsa:
```bash
npx prisma migrate deploy
```

### 3. Mavjud Buyurtmalarga Raqam Berish (agar bor bo'lsa)
```sql
-- PostgreSQL da ishga tushiring
UPDATE "Order" SET "orderNumber" = nextval(pg_get_serial_sequence('"Order"', 'orderNumber'))
WHERE "orderNumber" IS NULL;
```

## Ishlatish

Endi har bir yangi buyurtma avtomatik ravishda raqam oladi:

```json
{
  "id": "uuid-here",
  "orderNumber": 1000,  // ← Avtomatik
  "status": "NEW",
  "totalAmount": 150000,
  ...
}
```

## Frontend'da Ko'rsatish

```typescript
// Buyurtma raqamini ko'rsatish
<div>Buyurtma #{order.orderNumber}</div>

// Misol: Buyurtma #1000, #1001, #1002...
```

## Xususiyatlar

- ✅ Avtomatik raqamlash (1000 dan boshlanadi)
- ✅ Unique (takrorlanmaydi)
- ✅ Sequential (ketma-ket)
- ✅ Database level (xavfsiz)
- ✅ Real-time notification'da ham ko'rinadi

## Tekshirish

```bash
# Prisma Studio'da ko'rish
npx prisma studio

# Yoki SQL orqali
psql -d dokonect -c "SELECT id, \"orderNumber\", status FROM \"Order\" ORDER BY \"orderNumber\" DESC LIMIT 10;"
```
