# 🚀 AWS Deployment Guide

## 📋 O'zgarishlar Ro'yxati

1. ✅ Location API (lat/lng → manzil)
2. ✅ Register (lat/lng qo'shildi)
3. ✅ Category filter (categoryId)
4. ✅ Popular products
5. ✅ Chat rooms (token)
6. ✅ Orders debug
7. ✅ Debts yaxshilandi
8. ✅ Order numbering (1000+)

---

## 🔧 AWS Terminalida Qilish Kerak

### 1. SSH orqali AWS serverga kirish

```bash
ssh -i your-key.pem ubuntu@your-aws-ip
# yoki
ssh ubuntu@16.16.213.165
```

### 2. Loyiha papkasiga o'tish

```bash
cd /path/to/dokonect/nest-backend
# yoki
cd ~/dokonect/nest-backend
```

### 3. Git orqali yangilanishlarni olish

```bash
# Hozirgi o'zgarishlarni saqlash (agar kerak bo'lsa)
git stash

# Yangilanishlarni olish
git pull origin main
# yoki
git pull origin master

# Agar stash qilgan bo'lsangiz
git stash pop
```

### 4. Dependencies o'rnatish

```bash
# Yangi package (axios) o'rnatish
npm install

# Yoki faqat axios
npm install axios
```

### 5. Prisma Migration va Generate

```bash
# Prisma client generate
npx prisma generate

# Migration qo'llash
npx prisma migrate deploy

# Yoki development mode
npx prisma migrate dev
```

**Muhim:** Migration qo'llashdan oldin database backup oling!

```bash
# PostgreSQL backup (agar kerak bo'lsa)
pg_dump -U postgres -d dokonect > backup_$(date +%Y%m%d).sql
```

### 6. Build

```bash
# TypeScript build
npm run build
```

### 7. PM2 orqali serverni qayta ishga tushirish

```bash
# Serverni to'xtatish
pm2 stop dokonect-backend

# Yoki to'liq restart
pm2 restart dokonect-backend

# Yoki yangi jarayon boshlash (agar PM2 ishlatmasangiz)
pm2 start npm --name "dokonect-backend" -- run start:prod
```

### 8. Loglarni tekshirish

```bash
# PM2 logs
pm2 logs dokonect-backend

# Yoki real-time
pm2 logs dokonect-backend --lines 100
```

### 9. Status tekshirish

```bash
# PM2 status
pm2 status

# Server ishlayotganini tekshirish
curl http://localhost:5000/api/health
```

---

## 🔍 Muammolarni Hal Qilish

### Agar Migration Xato Bersa

```bash
# Migration holatini tekshirish
npx prisma migrate status

# Agar migration qo'llanmagan bo'lsa
npx prisma migrate deploy

# Agar jiddiy muammo bo'lsa (ehtiyot bo'ling!)
npx prisma migrate reset
```

### Agar Build Xato Bersa

```bash
# node_modules ni tozalash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Agar Port Band Bo'lsa

```bash
# Port 5000 ni tekshirish
lsof -i :5000

# Jarayonni to'xtatish
kill -9 <PID>
```

### Agar Database Connection Xato Bo'lsa

```bash
# .env faylini tekshirish
cat .env | grep DATABASE_URL

# Database connection test
npx prisma db pull
```

---

## 📊 Migration Tasdiqlanishi

Migration qo'llangandan keyin quyidagilar bo'lishi kerak:

### 1. Client jadvalida lat/lng

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name IN ('lat', 'lng');
```

### 2. Order jadvalida orderNumber

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Order' 
AND column_name = 'orderNumber';
```

---

## 🧪 Test Qilish

### 1. Health Check

```bash
curl http://your-aws-ip:5000/api/health
```

### 2. Location API

```bash
curl "http://your-aws-ip:5000/api/location/reverse-geocode?lat=41.2995&lng=69.2401"
```

### 3. Swagger UI

Brauzerda oching:
```
http://your-aws-ip:5000/api/docs
```

---

## 🔐 Environment Variables

`.env` faylini tekshiring:

```bash
cat .env
```

Kerakli o'zgaruvchilar:
```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📝 To'liq Deployment Script

Quyidagi scriptni ishlatishingiz mumkin:

```bash
#!/bin/bash

echo "🚀 Dokonect Backend Deployment"

# 1. Git pull
echo "📥 Pulling latest changes..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Prisma
echo "🗄️ Running Prisma migrations..."
npx prisma generate
npx prisma migrate deploy

# 4. Build
echo "🔨 Building..."
npm run build

# 5. Restart PM2
echo "♻️ Restarting server..."
pm2 restart dokonect-backend

# 6. Check status
echo "✅ Checking status..."
pm2 status
pm2 logs dokonect-backend --lines 20

echo "🎉 Deployment complete!"
```

Scriptni saqlang:
```bash
nano deploy.sh
chmod +x deploy.sh
./deploy.sh
```

---

## ⚠️ Muhim Eslatmalar

1. **Backup:** Migration qo'llashdan oldin database backup oling
2. **Test:** Avval test environmentda sinab ko'ring
3. **Downtime:** Migration paytida server bir necha soniya ishlamay qolishi mumkin
4. **Logs:** Har doim loglarni kuzatib boring
5. **Rollback:** Agar muammo bo'lsa, git revert qiling

---

## 🔄 Rollback (Agar Kerak Bo'lsa)

```bash
# Git orqali
git log --oneline -5
git revert <commit-hash>

# Database rollback
npx prisma migrate resolve --rolled-back <migration-name>

# PM2 restart
pm2 restart dokonect-backend
```

---

## 📞 Yordam

Agar muammo bo'lsa:
1. PM2 loglarni tekshiring: `pm2 logs`
2. Database connection tekshiring: `npx prisma db pull`
3. Build xatolarini tekshiring: `npm run build`
4. Port tekshiring: `lsof -i :5000`

---

**Status:** ✅ Production Ready
**Version:** 3.1.0
**Last Updated:** 2024
