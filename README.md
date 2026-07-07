# 🏠 House Rent & Sale

A full-stack real estate platform for listing, searching, and managing properties for rent or sale — built with Next.js 15, MongoDB, and Cloudinary.

🔗 **Live Demo:** [https://house-rent-sale-puce.vercel.app](https://house-rent-sale-puce.vercel.app)

---

## ✨ Features

- 🔐 Authentication — register, login, email verification, password reset (NextAuth + Resend)
- 🏡 Property listings — create, edit, delete with image uploads (Cloudinary)
- 🔍 Advanced search & filters — by type, price, location, amenities
- 🗺️ Interactive maps — view properties on a map (Leaflet / OpenStreetMap)
- 💬 Messaging — contact agents/owners directly
- ❤️ Favorites — save properties to your dashboard
- ⭐ Reviews — leave and read property reviews
- 🔔 Notifications — real-time in-app notifications
- 👤 User dashboard — manage your listings, messages, and profile
- 🛡️ Admin panel — manage users, properties, and platform settings
- ⚡ Rate limiting — via Upstash Redis

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MongoDB (Mongoose) |
| Auth | NextAuth.js v4 |
| Email | Resend |
| Images | Cloudinary |
| Maps | Leaflet + OpenStreetMap |
| Rate Limiting | Upstash Redis |
| Deployment | Vercel |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/bisratjenbere/remote-task.git
cd remote-task
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your `.env` file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# NextAuth
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

# Resend (Email)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Map defaults (Addis Ababa)
NEXT_PUBLIC_DEFAULT_MAP_LAT=9.03
NEXT_PUBLIC_DEFAULT_MAP_LNG=38.74
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. (Optional) Seed the database

```bash
npm run seed
```

---

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages & API routes
│   ├── (auth)/           # Login, register, password reset
│   ├── (dashboard)/      # User dashboard
│   ├── (admin)/          # Admin panel
│   ├── properties/       # Property listing & detail pages
│   └── api/              # REST API endpoints
├── components/           # Reusable UI components
├── lib/                  # Utilities, DB connection, auth config
├── models/               # Mongoose models
├── services/             # Business logic layer
└── types/                # TypeScript type definitions
```

---

## ☁️ Deploying to Vercel

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example`
4. Set `NEXTAUTH_URL` to your Vercel deployment URL
5. Deploy

> **MongoDB Atlas:** Make sure to allow all IPs (`0.0.0.0/0`) under Network Access so Vercel can connect.

---

## 📄 License

MIT
