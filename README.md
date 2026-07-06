# House Rent & Sale Platform

A full-stack web app for renting, buying, and selling houses. Built with Next.js and MongoDB.

## Features

- Browse, search, and filter properties (rent or sale)
- User login/register with secure authentication
- Add, edit, and delete property listings
- Upload property images
- Save favorites and message property owners
- Admin dashboard to manage users, listings, and categories

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend:** Next.js API Routes, MongoDB, Mongoose, NextAuth
- **Other:** Cloudinary (images), Resend (emails)
- **Deployment:** Vercel + MongoDB Atlas

## Getting Started

```bash
git clone https://github.com/your-username/house-rent-sale-platform.git
cd house-rent-sale-platform
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
```

## Folder Structure

```
app/         - pages and routes
components/  - reusable UI components
models/      - MongoDB/Mongoose models
lib/         - database and auth config
services/    - business logic
types/       - TypeScript types
public/      - static files
```

