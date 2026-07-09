# 🏠 House Rent & Sale

A full-stack real estate platform for listing, searching, and managing properties for rent or sale — built with Next.js, MongoDB, and Cloudinary.

🔗 **Live Demo:** [https://house-rent-sale-puce.vercel.app](https://house-rent-sale-puce.vercel.app)

---

## ✨ Features

- 🔐 Authentication — register, login, email verification, password reset
- 🏡 Property listings — create, edit, delete with image uploads
- 🔍 Advanced search & filters — by type, price, location, amenities
- 🗺️ Interactive maps — view properties on a map
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
| Framework | Next.js 16 (App Router) |
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

```bash
git clone https://github.com/bisratjenbere/House_Rent_Sale.git
cd House_Rent_Sale
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

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

# Map defaults
NEXT_PUBLIC_DEFAULT_MAP_LAT=9.03
NEXT_PUBLIC_DEFAULT_MAP_LNG=38.74
```

---

## 📄 License

MIT
