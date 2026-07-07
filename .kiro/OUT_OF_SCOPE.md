# Out of Scope Features - Complete List

This document consolidates all features and functionality explicitly marked as "Out of Scope" across all specs. These items are deferred for future consideration or explicitly decided against for v1.

---

## **1. data-layer Spec**

### User Deletion
- **Status:** OUT OF SCOPE for initial build
- **Reason:** No cascade strategy exists for user deletion
- **Details:** 
  - No delete-user endpoint in any current spec
  - Cascade impacts: owned properties, sent/received messages, reviews, favorites, notifications
  - Deferred until explicitly requested with clear cascade requirements

---

## **2. auth Spec**

### Authentication Methods
- **No standalone/custom JWT system alongside NextAuth** (D4)
  - Single auth mechanism: NextAuth with JWT session strategy only
  - No hand-rolled JWT layer
  
- **No OAuth/social login providers**
  - Email/password authentication only
  - Google, Facebook, GitHub, etc. not implemented

### Session Management
- **No early JWT revocation mechanism**
  - JWT sessions remain valid until 30-day expiry
  - Password reset does NOT invalidate existing sessions
  - No tokenVersion or passwordChangedAt tracking
  - No Redis blacklist for revoked tokens

---

## **3. property-search Spec**

### Agent Management
- **No write endpoints for agents**
  - Agent status is derived (not stored)
  - No separate Agent model or admin CRUD
  - Agents are users with ≥1 published property (D10)

### Authentication
- **No authenticated endpoints in this spec**
  - Entire spec is guest-facing browse/search/discovery
  - All endpoints are public read

---

## **4. user-dashboard Spec**

### Account Management
- **Actual account deletion / cascade logic** (deferred, see US-6)
  - Delete-account endpoint is notify-only placeholder
  - Sends email to admin for manual processing
  - No automatic data removal

### Media Management
- **Avatar image deletion from Cloudinary when replaced**
  - Minor cleanup gap, acceptable for v1
  - User.avatar is plain string URL (no publicId stored)
  - Low-volume, low-size assets

### Admin Features
- **Admin-side Settings page** (deferred per D14)
  - Same placeholder treatment as Reports/Analytics
  - No platform-config fields
  - No site-wide toggles

---

## **5. messaging-favorites Spec**

### Message Management
- **Message editing or deletion**
  - Messages are append-only for v1
  - Not requested

- **Rich-text formatting in messages**
  - Plain text only
  - No HTML, Markdown, or formatting

- **File attachments in messages**
  - Not requested
  - Text-only messages

### Real-time Features
- **Websockets / real-time message delivery** (D8)
  - V1 uses 30-second polling on client
  - No websockets infrastructure

- **Typing indicator or online status**
  - Requires real-time infrastructure
  - Deferred

### Bulk Operations
- **Bulk "mark all as read" across all conversations**
  - US-9 is per-conversation only
  - Not requested for cross-conversation bulk action

---

## **6. reviews-notifications Spec**

### Review Management
- **Editing review comments after submission**
  - Currently edit = full replace
  - Partial edit is future enhancement

- **Review moderation / admin review approval flow**
  - Reviews are immediately public upon submission
  - No approval gate

- **Review replies / threaded discussion**
  - One-level reviews only
  - No nested comments

- **Review images / photo uploads**
  - Text-only reviews

- **Review "helpful" voting / reactions**
  - Not requested

### Notification Delivery
- **Push notifications to mobile devices**
  - Email + in-app only
  - No mobile push infrastructure

- **Real-time notification delivery**
  - No websockets
  - User must refresh or poll to see new notifications

---

## **7. admin-dashboard Spec**

### Bulk Operations
- **Bulk delete**
  - Acceptable manual steps for infrequent admin tasks

- **Bulk reassign categories**
  - Manual operation via admin UI

### Admin Features
- **User impersonation / "login as user" feature**
  - Not requested

- **Audit log / activity history**
  - Not requested
  - All state changes implicit via updatedAt timestamps

- **Admin role hierarchy** (e.g., super-admin vs. moderator)
  - Single 'admin' role only

- **User suspension / ban system**
  - Delete user is already a placeholder
  - Suspension is future enhancement

- **Custom admin permissions / RBAC beyond role='admin'**
  - Not requested

### Complex Analytics
- **Advanced metrics** (revenue, growth trends, user engagement)
  - Out of scope per D15
  - Dashboard shows basic counts only
  - Await explicit requirements for specific metrics

### Placeholder Pages
- **Reports page** — Frontend placeholder, no endpoint
- **Analytics page** — Frontend placeholder, no endpoint
- **Admin Settings page** — Frontend placeholder, no endpoint

---

## **8. Global / Cross-Cutting Out of Scope**

### From product.md "Non-goals / future enhancements"
- ~~**Google Maps integration**~~ — **NOW IN SCOPE** (maps-integration spec)
  - **Implemented features:** Interactive map display on property details, map
    view for search results with marker clustering, radius-based search (1-50km),
    map picker for location selection in create/edit forms, geocoding and reverse
    geocoding, geospatial indexing for fast proximity queries
  - **Decision D3 updated:** Map location data storage (`{ lat, lng }`) was always
    in scope; map UI implementation is now complete

- **AI property recommendation**

- **Mortgage calculator**

- **Virtual/video tours**

- **Mobile app**

- **Multi-language support**

- **Online payment**

### Content Management
- **Testimonials admin CRUD** (D11)
  - Static content only
  - Hardcoded array in homepage component

- **FAQ admin editing** (D13)
  - Static content in page components/MDX

- **About/Privacy Policy admin editing** (D13)
  - Static content, not CMS-managed

### Contact Form
- **Contact inquiry admin UI** (D12)
  - Admin reviews via direct DB or email
  - No dedicated inbox interface

---

## **Summary by Category**

### **Deferred (Require Future Specs)**
- User deletion with cascade strategy
- OAuth/social login
- JWT session revocation
- Real-time features (websockets, typing indicators)
- Review moderation workflow
- Admin audit logs
- Complex analytics/reports
- Mobile push notifications

### **Explicitly Decided Against (for v1)**
- Custom JWT alongside NextAuth (D4)
- Agent write endpoints (D10 — derived only)
- Websockets for messaging (D8 — polling instead)
- Admin settings page (D14 — placeholder)
- Reports/Analytics endpoints (D15 — placeholder)

### **Minor Gaps Accepted**
- Avatar cleanup from Cloudinary
- Message append-only (no edit/delete)
- Plain text only (no rich formatting)
- Review text-only (no images)

### **Manual Operations Accepted**
- Bulk category reassignment
- Account deletion requests (admin processes manually)
- Contact inquiry review (via DB/email)

---

## **How to Handle Out of Scope Items**

1. **If a user requests an out-of-scope feature:**
   - Acknowledge it's currently out of scope
   - Reference this document
   - Create a new spec if the feature is approved

2. **During implementation:**
   - Do NOT add out-of-scope features
   - Do NOT build speculative automation
   - Maintain placeholders as designed

3. **For future planning:**
   - Use this list to prioritize post-v1 enhancements
   - Group related features into coherent specs
   - Ensure cascade strategies are defined before user deletion

---

**Last Updated:** Based on all 8 specs (data-layer, auth, property-crud, property-search, user-dashboard, messaging-favorites, reviews-notifications, admin-dashboard)
