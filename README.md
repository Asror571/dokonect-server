# 🚀 Dokonect - B2B Marketplace Backend

Express.js dan NestJS ga migratsiya qilingan B2B marketplace backend tizimi.

## 📋 Loyiha Haqida

**Dokonect** - do'kon egalari va distribyutorlarni bog'laydigan B2B elektron savdo platformasi.

- **Do'kon egalari** - mahsulot buyurtma qiladi
- **Distribyutorlar** - mahsulot sotadi va boshqaradi
- **Haydovchilar** - mahsulotni yetkazib beradi
- **Admin** - tizimni boshqaradi

Batafsil ma'lumot: [PROJECT_PURPOSE.md](PROJECT_PURPOSE.md)

---

## 🛠️ Texnologiyalar

- **NestJS** - Backend framework
- **PostgreSQL** - Database
- **Prisma ORM** - Database ORM
- **JWT** - Authentication
- **Socket.io** - Real-time chat
- **Cloudinary** - Image storage
- **Swagger** - API documentation

---

## 🚀 O'rnatish va Ishga Tushirish

### 1. Dependencies O'rnatish
```bash
cd nest-backend
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
# .env faylini to'ldiring
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Ishga Tushirish

**Development:**
```bash
npm run start:dev
```

**Production:**
```bash
npm run build
npm run start:prod
```

---

## 📚 API Documentation

- **Server**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/api/docs

---

## 📦 Modullar (21 ta)

### Core Modules
1. **Auth** - Authentication & Authorization
2. **Product** - Mahsulot boshqaruvi
3. **Order** - Buyurtma boshqaruvi
4. **Chat** - Real-time chat
5. **Client** - Do'kon egalari
6. **Distributor** - Distribyutorlar
7. **Driver** - Haydovchilar
8. **Admin** - Admin panel

### Feature Modules
9. **Notification** - Bildirishnomalar
10. **Debt** - Qarz boshqaruvi
11. **Review** - Sharh va reyting
12. **Analytics** - Analitika
13. **Inventory** - Inventar boshqaruvi
14. **Warehouse** - Ombor boshqaruvi
15. **Pricing** - Narx qoidalari
16. **Promo Code** - Promo kodlar

### Utility Modules
17. **Category** - Kategoriyalar
18. **Brand** - Brendlar
19. **Upload** - Fayl yuklash
20. **Bulk Upload** - Excel yuklash
21. **Cloudinary** - Rasm xizmati

---

## 🔑 Asosiy Endpointlar

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Orders
```
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
```

To'liq API dokumentatsiya: http://localhost:5000/api/docs

---

## 📁 Loyiha Strukturasi

```
nest-backend/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Root module
│   ├── prisma/                 # Prisma service
│   ├── common/                 # Guards, decorators, filters
│   └── modules/                # Feature modules
│       ├── auth/
│       ├── product/
│       ├── order/
│       ├── chat/
│       ├── client/
│       ├── distributor/
│       ├── driver/
│       ├── admin/
│       ├── notification/
│       ├── debt/
│       ├── review/
│       ├── analytics/
│       ├── inventory/
│       ├── warehouse/
│       ├── pricing/
│       ├── category/
│       ├── upload/
│       └── bulk-upload/
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

---

## 📖 Qo'shimcha Dokumentatsiya

- [PROJECT_PURPOSE.md](PROJECT_PURPOSE.md) - Loyiha maqsadi va vazifasi
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Express.js → NestJS migratsiya qo'llanmasi
- [COMPARISON.md](COMPARISON.md) - Express.js vs NestJS taqqoslash
- [WHY_NEW_MODULES.md](WHY_NEW_MODULES.md) - Nega yangi modullar qo'shildi?
- [FINAL_REPORT.md](FINAL_REPORT.md) - Yakuniy migratsiya hisoboti

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🔧 Scripts

```bash
npm run start          # Start
npm run start:dev      # Development mode
npm run start:prod     # Production mode
npm run build          # Build
npm run lint           # Lint
npm run format         # Format code
```

---

## 📊 Migratsiya Holati

- ✅ 100% Express.js funksiyalari o'tkazildi
- ✅ 8 ta yangi modul qo'shildi
- ✅ Build successful
- ✅ Production ready
- ✅ Swagger documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

ISC

---

## 👨‍💻 Development Team

Dokonect Development Team

---

**Status**: ✅ Production Ready
**Version**: 3.0.0 (NestJS)
**Last Updated**: 2024
