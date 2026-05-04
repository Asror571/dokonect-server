# Prisma Generate Muammosini Hal Qilish

## ❌ Muammo

```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp' -> 'query_engine-windows.dll.node'
```

## ✅ Yechim

### 1. Serverni To'xtatish

Agar server ishlab turgan bo'lsa, to'xtating (Ctrl+C)

### 2. Node.js Jarayonlarini To'xtatish

```bash
# Windows'da
taskkill /F /IM node.exe

# Yoki Task Manager orqali barcha Node.js jarayonlarini to'xtating
```

### 3. Prisma Generate

```bash
cd nest-backend
npx prisma generate
```

### 4. Serverni Qayta Ishga Tushirish

```bash
npm run start:dev
```

## 🔄 Agar Yana Xato Bo'lsa

### Variant 1: node_modules ni o'chirish

```bash
# node_modules va package-lock.json ni o'chirish
rm -rf node_modules package-lock.json

# Qayta o'rnatish
npm install
npx prisma generate
```

### Variant 2: .prisma papkasini o'chirish

```bash
# Faqat .prisma papkasini o'chirish
rm -rf node_modules/.prisma

# Qayta generate
npx prisma generate
```

### Variant 3: VS Code yoki IDE'ni yopish

Ba'zan IDE fayl lock qiladi:
1. VS Code yoki boshqa IDE'ni yoping
2. Terminal'da `npx prisma generate` ni ishga tushiring
3. IDE'ni qayta oching

## 📊 orderNumber Xususiyati

Migration qo'llandi, lekin Prisma Client hali yangilanmagan. 

**Hozirgi holat:**
- ✅ Database'da `orderNumber` maydoni bor
- ❌ Prisma Client'da hali yo'q (generate kerak)

**Keyingi qadamlar:**
1. Yuqoridagi yechimlardan birini qo'llang
2. `npx prisma generate` muvaffaqiyatli tugagandan keyin
3. `debt.service.ts` va `order.service.ts` fayllaridagi `// TODO` commentlarini oching:

```typescript
// Eski:
// orderNumber: true, // TODO: Uncomment after prisma generate

// Yangi:
orderNumber: true,
```

## 🎯 Test Qilish

```bash
# Generate muvaffaqiyatli bo'lganini tekshirish
npx prisma generate

# Server ishga tushirish
npm run start:dev

# API test qilish
curl http://localhost:5000/api/orders
```

## 💡 Kelajakda Oldini Olish

Migration qo'llashdan keyin doim:
```bash
npx prisma generate
```

Yoki package.json'ga script qo'shing:
```json
{
  "scripts": {
    "migrate": "prisma migrate dev && prisma generate"
  }
}
```
