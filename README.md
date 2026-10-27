# U Want Reading? — Reading Soundscape

เว็บแอปอ่าน PDF หลายแท็บ พร้อมระบบแนะนำเสียงบรรยากาศ (โครงงาน CP353761) รายละเอียดขอบเขตอยู่ใน [CLAUDE.md](CLAUDE.md)

## โครงสร้าง

```
backend/    Express + PostgreSQL (API ที่ http://localhost:5001/api)
frontend/   React + TypeScript + Vite (http://localhost:3000)
```

## ติดตั้งครั้งแรก

ต้องมี Node.js 18+ และ PostgreSQL ที่รันอยู่

1. ตั้งค่า backend
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   แก้ `DATABASE_URL` ใน `.env` ให้ใส่รหัสผ่านของ user `postgres` และตั้ง `JWT_SECRET` เป็นข้อความสุ่มยาว ๆ
2. สร้างฐานข้อมูล ตาราง และข้อมูล preset
   ```bash
   npm run db:migrate
   ```
3. ติดตั้ง frontend
   ```bash
   cd ../frontend
   npm install
   ```

## รัน (ใช้ 2 terminal)

```bash
cd backend && npm run dev
```
```bash
cd frontend && npm run dev
```

เปิด http://localhost:3000 — Vite จะ proxy `/api` ไปที่ backend เอง

## ดูข้อมูลในฐานข้อมูล

ใช้ pgAdmin (มาพร้อม PostgreSQL) เชื่อมต่อ `localhost:5432` แล้วเปิดฐานข้อมูล `reading_soundscape`
