# Furniture Admin Fullstack (Angular + Node.js + MongoDB)

Trang admin quan ly website ban do noi that.

## 1) Cong nghe
- Frontend: Angular 20 standalone
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: JWT Bearer token

## 2) Chuc nang admin
- Dang nhap admin
- Dashboard doanh thu (hom nay, thang, tong don, tong user, tong san pham)
- Bieu do doanh thu theo thang
- Quan ly san pham
- Quan ly danh muc
- Quan ly don hang
- Quan ly nguoi dung
- Quan ly danh gia
- Quan ly lien he
- Quan ly bai viet
- Quan ly tai khoan admin (doi mat khau)

## 3) Cau truc
- backend/: REST API + MongoDB models
- frontend/: Angular admin UI

## 4) Chay du an
Yeu cau: cai Node.js 20+ va MongoDB.

### Buoc 1: Cai dependencies
- Tai thu muc goc project:
  - `npm run install:all`

Neu script tren loi, cai thu cong:
- `npm install --prefix backend`
- `npm install --prefix frontend`

### Buoc 2: Cai dat bien moi truong backend
- Copy `backend/.env.example` thanh `backend/.env`
- Chinh sua `MONGO_URI`, `JWT_SECRET` neu can

### Buoc 3: Seed du lieu mau
- `npm run seed`

Tai khoan admin mac dinh:
- Email: admin@furniture.com
- Password: Admin@123

### Buoc 4: Chay backend
- `npm run dev:backend`

### Buoc 5: Chay frontend
- Terminal moi:
- `npm run dev:frontend`
- Truy cap: http://localhost:4200

## 5) API chinh
- Auth:
  - POST /api/auth/login
  - POST /api/auth/register-admin
  - PUT /api/auth/change-password
- Dashboard:
  - GET /api/dashboard/summary
- CRUD:
  - /api/users
  - /api/products
  - /api/categories
  - /api/orders
  - /api/reviews
  - /api/contacts
  - /api/posts

Tat ca endpoint /api (tru /api/auth/login va /api/auth/register-admin) deu yeu cau token admin.
