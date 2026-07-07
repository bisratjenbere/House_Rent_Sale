# Product: House Rent & Sale Platform

## What this is
A full-stack real estate web app for renting, buying, and selling houses. Users
search properties, contact owners/agents, save favorites, and manage listings
through a secure dashboard.

## User roles & what each can do

**Guest**
- Browse properties, search & filter, view property details
- Register / login, contact agent

**User (logged in)**
- Manage profile
- Add / edit / delete own properties
- Upload property images
- Save favorites
- Send inquiries / messages
- Manage own listings

**Admin**
- Dashboard with analytics/reports
- Manage users
- Approve or delete listings
- Manage categories

## Core feature areas (build in this order of priority)
1. Auth: register, login, logout, forgot password, email verification, reset password
2. Property CRUD: create/update/delete, multiple image upload, rent/sale type, featured flag
3. Search & filters: rent/sale, city, property type, price, bedrooms, bathrooms, featured, latest
4. Favorites
5. Messaging (inquiries between user and agent/owner)
6. Reviews & ratings — **eligibility rule (D7): a user may only review a property they've previously messaged the owner about (one inquiry thread = review-eligible). One review per user per property.**
7. Notifications + email alerts
8. Admin dashboard (users, properties, categories, reports, analytics)

## Property data model (fields)
Title, Description, Property Type, Category, Price, Bedrooms, Bathrooms,
Kitchens, Parking, Area, Address, City, Region, Map Location, Amenities,
Images, Status

### Property Type vs Category (resolved, D2)
These are two independent taxonomies — do not merge them:
- **Property Type** — fixed enum, code-level, not admin-editable:
  `house | apartment | villa | studio | land | commercial-unit`
- **Category** — admin-managed collection (e.g. Residential, Commercial,
  Luxury, Short-let), editable via the admin Categories screen.

### Property status lifecycle (resolved, D1)
```
draft → pending_review → published
                       ↘ rejected (with rejectionReason) → back to draft on edit
published → rented | sold → archived
```
- New listings start as `draft` (autosave) or move to `pending_review` on submit.
- Admin's "Approve listings" feature acts on `pending_review` → `published` or `rejected`.
- Only `published` listings appear in public search/browse.
- `archived` = soft-deleted, hidden everywhere by default.

### Map Location (resolved, D3)
Store `{ lat, lng }` on every property now (via manual input or one-time
geocoding from Address/City/Region at creation time). Map UI is now
implemented (maps-integration spec) using OpenStreetMap + Leaflet/react-leaflet
(no API key required): interactive map display on property details, map view
for search results, radius-based search via Nominatim geocoding, and map picker
for location selection in property forms. No longer deferred.

### Agents (resolved, D10)
Agents are NOT a separate role or model. An "agent" is simply a User
(role: user) who owns at least one published property. No Agent.ts model,
no separate role value, no /api/agents write endpoints.
- Add read-only endpoints: GET /api/agents (list users with >=1 published
  property, derived via aggregation — not a stored flag) and
  GET /api/agents/:id (public profile + their published listings).
- "Contact agent" reuses the existing Message model — the agent is just
  the property's `owner`. No new messaging path.

### Homepage aggregate sections (resolved, D11)
- **Testimonials**: static content only in this phase. No model, no admin
  CRUD, no API route — hardcoded array in the homepage component. Treat
  as a future enhancement if a real testimonial system is ever needed.
- **Statistics**: GET /api/stats/public — Mongo aggregation returning counts
  (published properties, distinct cities, agents, categories). Cached
  with the same 5-minute ISR pattern as Featured/Latest (extends D9).
- **Popular Cities**: GET /api/properties/cities/popular — top N cities by
  published-listing count via aggregation. Same 5-minute ISR caching
  (extends D9). No new collection — computed from Property.city.

### Contact form (resolved, D12)
Site-level contact form, distinct from "contact agent" messaging. Add a
minimal ContactInquiry model: { name, email, phone?, message, createdAt }.
Endpoint: POST /api/contact (public). Rate-limited at 5 req/min/IP
(extends D5). On submit: store the document and send a notification email
to a fixed admin address via Resend. No dedicated admin UI in this phase —
admin can review via direct DB/email; do not build a full inbox for this.

### Static content pages (resolved, D13)
About, FAQ, Privacy Policy are static content. No models, no admin
management UI, no API routes. Content lives directly in the page
components/MDX. If FAQ ever needs admin editing, that's a future
enhancement, not part of this build.

### Settings vs. Profile split (resolved, D14)
- **Profile** = public-facing identity: name, avatar, phone, bio. Existing
  GET/PUT /api/profile covers this — no change.
- **Settings** = account-level preferences, NOT public-facing: password
  change, a single `emailNotificationsEnabled: Boolean` toggle on User
  (controls whether the two Resend triggers from reviews-notifications
  actually fire for that user), and an account-deletion request flow.
- Add PUT /api/settings (separate endpoint from /api/profile — different
  concern, different auth-sensitivity: password change requires
  re-entering current password).
- Admin Settings page: out of scope for this phase, same placeholder
  treatment as Reports/Analytics (D15) — do not invent platform-config
  fields that were never asked for.

### Reports and Analytics (resolved, D15)
Reports and Analytics stay placeholders. No model, no endpoint, until
specific metrics are requested. Do not infer metrics from "View reports"
in product.md.

### Free-text search (resolved, D16)
The "Search" homepage section (distinct from filter controls) enables
free-text keyword search across property title, description, and city.
MongoDB text index on Property collection with weights: `{ title: 10,
city: 5, description: 1 }`. API layer exposes this via `$text` query
operator in the property-search spec.

### Editing published listings (resolved, D18)
Editing a published property resets its status to `pending_review` — the
listing is hidden from public search/browse until re-approved, same as a
fresh submission. This applies only to owner-initiated edits; admin edits
to any property (including published ones) do NOT trigger this reset.
This preserves the integrity of the admin approval gate (D1) — approval
covers the content actually shown to the public, not just the first
version ever submitted.

### Email verification requirement (resolved, D17)
Unverified users cannot log in. The login endpoint checks `emailVerified`;
if false, reject with a clear error directing them to check their inbox
or resend the verification email. Registration response must make clear
that login won't work until verification completes. A "resend verification
email" endpoint (POST /api/auth/resend-verification) is required since
users who lose or ignore the first email need a way back in.

## Pages required
**Public:** Home, About, Properties, Property Details, Agents, Contact, Login,
Register, FAQ, Privacy Policy

**User Dashboard:** Dashboard, My Properties, Add Property, Edit Property,
Favorites, Messages, Profile, Settings

**Admin Dashboard:** Dashboard, Users, Properties, Categories, Reports,
Analytics, Settings

## Homepage sections (in order)
Hero → Search → Featured Properties → Categories → Latest Properties →
Popular Cities → Testimonials → Statistics → CTA → Footer

## Non-goals / future enhancements (do NOT build unless explicitly asked)
AI property recommendation, mortgage calculator, virtual/video tours, mobile
app, multi-language, online payment.

> Maps integration is IN SCOPE and implemented (maps-integration spec).
