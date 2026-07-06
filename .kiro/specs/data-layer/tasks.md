# Tasks: Data Layer

Depends on: D1, D2, D3, D7, D10, D11, D12, D14, D16

- [x] T1: Set up MongoDB connection utility
  - Create `lib/db.ts`
  - Implement singleton connection pattern with global caching for serverless
  - Export `connectDB()` function
  - Handle connection errors with logging
  - Accept: Connection successfully established; can be imported and called
    from any API route

- [x] T2: Create User model
  - Create `models/User.ts`
  - Define `IUser` TypeScript interface extending Mongoose Document
  - Implement User schema with all fields from US-1 (Design section 4)
  - Set role enum: `['user', 'admin']` (default: 'user')
  - Add email unique index
  - Use Next.js-safe model export pattern:
    `mongoose.models.User || mongoose.model<IUser>('User', UserSchema)`
  - Accept: Model can be imported; sample user document can be created and
    queried

- [x] T3: Create Property model with text search index (D16)
  - Create `models/Property.ts`
  - Define `IProperty` TypeScript interface
  - Implement Property schema with all fields from US-2, including:
    - propertyType enum per D2
    - category ObjectId ref per D2
    - location: { lat, lng } OPTIONAL per D3 (not all properties have
      geocodable addresses; if provided, both lat and lng must be present)
    - images: [{ url: String, publicId: String }] with schema-level
      max-10 validator per D6
    - status enum per D1
    - bedrooms/bathrooms/kitchens/parking as optional (default: 0)
  - Add all indexes from Design section 4, including the text index:
    `{ title: 'text', description: 'text', city: 'text' }` with weights
    `{ title: 10, city: 5, description: 1 }` (D16)
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; text search works via
    `Property.find({ $text: { $search: 'keyword' } })`; Mongoose
    auto-creates indexes on first model use (for production, explicitly
    call `Property.createIndexes()` in deployment script for faster startup)

- [x] T4: Create Category model
  - Create `models/Category.ts`
  - Define `ICategory` interface
  - Implement Category schema with fields from US-3
  - Add unique indexes on name and slug
  - Implement pre-save hook to auto-generate slug from name
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; slug is auto-generated on save if not
    provided

- [x] T5: Create Favorite model
  - Create `models/Favorite.ts`
  - Define `IFavorite` interface
  - Implement Favorite schema with fields from US-4
  - Add compound unique index `{ user: 1, property: 1 }`
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; duplicate favorites are rejected by
    unique constraint

- [x] T6: Create Message model
  - Create `models/Message.ts`
  - Define `IMessage` interface
  - Implement Message schema with fields from US-5
  - Add indexes: `{ property: 1, createdAt: -1 }`,
    `{ receiver: 1, read: 1, createdAt: -1 }`, `{ sender: 1, createdAt: -1 }`
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; messages can be queried by property,
    sender, or receiver

- [x] T7: Create Review model
  - Create `models/Review.ts`
  - Define `IReview` interface
  - Implement Review schema with fields from US-6
  - Add compound unique index `{ user: 1, property: 1 }`
  - Add index `{ property: 1, createdAt: -1 }`
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; duplicate reviews are rejected by
    unique constraint

- [x] T8: Create Notification model
  - Create `models/Notification.ts`
  - Define `INotification` interface
  - Implement Notification schema with fields from US-7, including
    `type` enum `['message','review','property_status','system']`,
    optional `relatedProperty` (ref Property), and optional
    `relatedPropertyStatus`
  - Add index `{ user: 1, read: 1, createdAt: -1 }`
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; notifications can be queried by user
    and read status; relatedProperty can be populated when present

- [x] T9: Create Amenity model
  - Create `models/Amenity.ts`
  - Define `IAmenity` interface
  - Implement Amenity schema with fields from US-8
  - Add unique index on name
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; duplicate amenity names are rejected

- [x] T10: Create ContactInquiry model (D12)
  - Create `models/ContactInquiry.ts`
  - Define `IContactInquiry` interface
  - Implement ContactInquiry schema with fields from US-9
  - Add index `{ createdAt: -1 }`
  - Use Next.js-safe model export pattern
  - Accept: Model can be imported; contact inquiries can be queried
    sorted by creation date

- [x] T11: Create barrel export file
  - Create `models/index.ts`
  - Export all models as named exports (User, Property, Category,
    Favorite, Message, Review, Notification, Amenity, ContactInquiry)
  - Re-export all TypeScript interfaces as named type exports
  - Accept: Can import models via `import { User, Property } from '@/models'`;
    can import types via `import type { IUser, IProperty } from '@/models'`

- [x] T12: Update structure.md with new API routes (D10, D11, D12)
  - Add amenity admin routes to structure.md's Known API Routes section
  - Verify all routes from D10 (agents), D11 (stats, popular cities), and
    D12 (contact) are already listed
  - Accept: structure.md reflects the complete API surface including
    amenity admin endpoints

- [x] T13: Create .env.example file
  - Create `.env.example` in project root
  - Add `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
  - Accept: File exists and documents required MongoDB connection string

- [x] T14: Verify data layer integration, then remove test endpoint
  - Create a temporary test API route `app/api/_test/route.ts` that:
    - Calls `connectDB()`
    - Queries User model (e.g., `User.countDocuments()`)
    - Returns JSON: `{ success: true, dbConnected: true, userCount: <count> }`
  - Start dev server and verify endpoint returns success
  - After verification, delete the entire `app/api/_test/` directory —
    do not leave this unauthenticated endpoint in the codebase
  - Accept: Database connection verified working; test endpoint has been
    removed; no `app/api/_test/` directory exists

## Cascade Deletion Note
User deletion is OUT OF SCOPE for the initial build. No delete-user
endpoint is being built in any current spec. The cascade strategy for
user deletion is deferred until such a feature is explicitly requested.
Property and Category deletion cascades will be implemented in their
respective specs (property-crud, admin-dashboard).

## Definition of Done
All 9 model files + index.ts exist, db.ts provides a working cached
connection, all EARS acceptance criteria in requirements.md pass
(including text search, image-array max-10 validation, and duplicate
favorite/review rejection), structure.md is updated, .env.example exists,
and the temporary verification endpoint has been removed from the codebase.
