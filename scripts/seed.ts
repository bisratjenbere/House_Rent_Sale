/**
 * Comprehensive seed script for HouseHub.
 * 
 * Usage:
 *   npx tsx scripts/seed.ts
 *   FORCE=true npx tsx scripts/seed.ts   # skip confirmation prompt
 * 
 * Prerequisites:
 *   - MongoDB running / accessible via MONGODB_URI
 *   - tsx installed as a dev dependency
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import {
  User,
  Property,
  Category,
  Amenity,
  Review,
  Message,
  Favorite,
  Notification,
  ContactInquiry,
} from '@/models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readlineSyncQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(query);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim().toLowerCase());
    });
  });
}

async function confirmDestroy() {
  const force = process.env.FORCE === 'true';
  if (force) return true;

  const answer = await readlineSyncQuestion(
    '\n⚠️  This will DELETE all existing data in the database. Continue? (y/N): '
  );
  return answer === 'y' || answer === 'yes';
}

// ---------------------------------------------------------------------------
// Ethiopian seed data
// ---------------------------------------------------------------------------

const ETHIOPIAN_FIRST_NAMES = [
  'Abebe', 'Tigist', 'Kebede', 'Sara', 'Dawit', 'Hana', 'Yonas', 'Marta',
  'Bereket', 'Helen', 'Solomon', 'Rahel', 'Tadesse', 'Meseret', 'Getachew',
  'Almaz', 'Alem', 'Fasika', 'Liya', 'Natnael',
];

const ETHIOPIAN_LAST_NAMES = [
  'Bikila', 'Haile', 'Bekele', 'Tekle', 'Mekonnen', 'Tadesse', 'Girma',
  'Alemu', 'Gebre', 'Tesfaye', 'Desta', 'Kassa', 'Wolde', 'Ayele', 'Shimelis',
];

const AGENTS = [
  { name: 'Abebe Bikila', phone: '+251911234567', bio: 'Experienced real estate agent based in Addis Ababa with over 10 years in residential and commercial listings.' },
  { name: 'Tigist Haile', phone: '+251922345678', bio: 'Specializing in luxury villas and apartments in Addis Ababa and Bahir Dar. Fluent in Amharic and English.' },
  { name: 'Kebede Bekele', phone: '+251933456789', bio: 'Trusted property consultant in Hawassa and Adama. Helping families find their dream homes since 2015.' },
];

const REGULAR_USERS = [
  { name: 'Sara Tekle', phone: '+251911987654', bio: 'Looking for rental apartments in Bole.' },
  { name: 'Dawit Mekonnen', phone: '+251922876543', bio: 'Investor interested in commercial properties.' },
  { name: 'Hana Tadesse', phone: '+251933765432', bio: 'Software engineer seeking a studio near Bole.' },
  { name: 'Yonas Girma', phone: '+251944654321', bio: 'Recently married, looking for a family house.' },
  { name: 'Marta Alemu', phone: '+251955543210', bio: 'PhD student needing a quiet apartment near AAU.' },
  { name: 'Bereket Gebre', phone: '+251966432109', bio: 'Small business owner looking for shop space.' },
];

const ADMIN = {
  name: 'Super Admin',
  email: 'admin@househub.et',
};

const REVIEW_MESSAGES = [
  'Great property! The house is exactly as described. Very spacious and well-maintained.',
  'Good location but the building could use some maintenance. Overall decent for the price.',
  'Absolutely love this apartment. The neighborhood is safe and the amenities are top-notch.',
  'The landlord was very responsive and helpful. Would definitely recommend.',
  'Nice studio for a single person. Close to public transport and cafés.',
  'The view from the villa is breathtaking. Worth every penny.',
  'Average experience. The property photos were a bit misleading.',
  'Excellent communication with the agent. Smooth transaction from start to finish.',
];

const INQUIRY_MESSAGES = [
  'ስለ ንብረቱ መረጃ እፈልጋለሁ። ዋጋው ስለሚከብር እርስዎ እንደሚፈልጉ ተስፋ አደርጋለሁ።',
  'I am interested in this property. Is it still available?',
  'Can I schedule a viewing this weekend?',
  'Is the price negotiable? I am ready to move in next month.',
  'እባክዎን ሌሎች ምስሎች እንዲላኩልኝ እፈልጋለሁ።',
  'Does the rent include water and electricity?',
  'I would like to know more about the security arrangements in the building.',
  'Is there a parking space included with the apartment?',
  'እርስዎ ከሚያስችሉን አመሰግናለሁ። በቅርቡ ስለሚገባዎት ነገር እናገላለሁ።',
  'Can you tell me if the property is near any schools or hospitals?',
];

// ---------------------------------------------------------------------------
// Seeder
// ---------------------------------------------------------------------------

async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Connect
  await connectDB();
  console.log('✅ MongoDB connected\n');

  // 2. Confirm
  const ok = await confirmDestroy();
  if (!ok) {
    console.log('🛑 Seed cancelled by user.');
    process.exit(0);
  }

  // 3. Clear all collections (dependency order)
  console.log('🧹 Clearing existing data...\n');
  const models = [Favorite, Message, Review, Notification, ContactInquiry, Property, User, Category, Amenity];
  for (const m of models) {
    await m.deleteMany({});
  }
  console.log('   All collections cleared.\n');

  // 4. Categories
  const categories = await Category.insertMany([
    { name: 'Residential House', slug: 'residential-house', description: 'Standalone houses for families.' },
    { name: 'Apartment', slug: 'apartment', description: 'Multi-unit residential buildings.' },
    { name: 'Villa', slug: 'villa', description: 'Luxury standalone homes.' },
    { name: 'Studio', slug: 'studio', description: 'Compact single-room units ideal for singles or students.' },
    { name: 'Land Plot', slug: 'land-plot', description: 'Empty land for development or investment.' },
    { name: 'Commercial Unit', slug: 'commercial-unit', description: 'Retail shops, offices, and commercial spaces.' },
  ]);
  console.log(`📂 Inserted ${categories.length} categories`);

  const categoryMap = new Map(categories.map((c) => [c.name, c._id]));

  // 5. Amenities
  const amenities = await Amenity.insertMany([
    { name: 'Parking', icon: 'car' },
    { name: 'Security Guard', icon: 'shield' },
    { name: '24/7 Electricity', icon: 'zap' },
    { name: 'Water Supply', icon: 'droplets' },
    { name: 'Internet', icon: 'wifi' },
    { name: 'Generator Backup', icon: 'battery-charging' },
    { name: 'Balcony', icon: 'sun' },
    { name: 'Garden', icon: 'tree-pine' },
    { name: 'Swimming Pool', icon: 'waves' },
    { name: 'Gym', icon: 'dumbbell' },
    { name: 'Elevator', icon: 'arrow-up' },
    { name: 'Solar Power', icon: 'sun' },
  ]);
  console.log(`🔧 Inserted ${amenities.length} amenities`);

  const amenityMap = new Map(amenities.map((a) => [a.name, a._id]));

  // 6. Users
  const bcryptHash = (pw: string) => bcrypt.hashSync(pw, 10);

  const users: mongoose.HydratedDocument<any>[] = [];

  const admin = await User.create({
    name: ADMIN.name,
    email: ADMIN.email,
    password: bcryptHash('Admin@123'),
    role: 'admin',
    phone: '+251911000000',
    emailVerified: true,
    emailNotificationsEnabled: true,
  });
  users.push(admin);

  for (const a of AGENTS) {
    const u = await User.create({
      name: a.name,
      email: `${a.name.toLowerCase().replace(/[^a-z]/g, '')}@househub.et`,
      password: bcryptHash('agent123'),
      role: 'user', // agents are regular users who happen to own properties
      phone: a.phone,
      bio: a.bio,
      emailVerified: true,
      emailNotificationsEnabled: true,
    });
    users.push(u);
  }

  for (const u of REGULAR_USERS) {
    const created = await User.create({
      name: u.name,
      email: `${u.name.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
      password: bcryptHash('password123'),
      role: 'user',
      phone: u.phone,
      bio: u.bio,
      emailVerified: true,
      emailNotificationsEnabled: true,
    });
    users.push(created);
  }
  console.log(`👥 Inserted ${users.length} users (1 admin, 3 agents, 6 regular)`);

  const allUsers = users.map((u) => ({ _id: u._id, role: (u as any).role, name: u.name }));
  const agentUsers = allUsers.filter((u) => u.role === 'user').slice(1, 4); // 3 agents after admin
  const regularUsers = allUsers.filter((u) => u.role === 'user').slice(4);

  const adminUserId = admin._id;
  const agentUserIds = agentUsers.map((u) => u._id);
  const regularUserIds = regularUsers.map((u) => u._id);

  // 7. Properties
  const propertyTemplates = [
    { title: 'Modern 3BR House in Bole', city: 'Addis Ababa', region: 'Addis Ababa', type: 'house', listingType: 'rent', price: 85000, bedrooms: 3, bathrooms: 2, kitchens: 1, parking: 2, area: 180, status: 'published', featured: true, lat: 9.02, lng: 38.75, imageCount: 3 },
    { title: 'Luxury Villa in Kazanchis', city: 'Addis Ababa', region: 'Addis Ababa', type: 'villa', listingType: 'sale', price: 25000000, bedrooms: 5, bathrooms: 4, kitchens: 2, parking: 3, area: 450, status: 'published', featured: true, lat: 9.03, lng: 38.76, imageCount: 4 },
    { title: 'Cozy Studio Near AAU', city: 'Addis Ababa', region: 'Addis Ababa', type: 'studio', listingType: 'rent', price: 25000, bedrooms: 1, bathrooms: 1, kitchens: 1, parking: 0, area: 35, status: 'published', featured: false, lat: 9.01, lng: 38.74, imageCount: 2 },
    { title: 'Spacious Apartment in Bishoftu', city: 'Adama', region: 'Oromia', type: 'apartment', listingType: 'rent', price: 45000, bedrooms: 2, bathrooms: 2, kitchens: 1, parking: 1, area: 90, status: 'published', featured: false, lat: 8.75, lng: 39.0, imageCount: 3 },
    { title: 'Commercial Space in Meskel Square', city: 'Addis Ababa', region: 'Addis Ababa', type: 'commercial-unit', listingType: 'rent', price: 120000, bedrooms: 0, bathrooms: 1, kitchens: 1, parking: 4, area: 200, status: 'published', featured: true, lat: 9.04, lng: 38.77, imageCount: 3 },
    { title: 'Family House in Bahir Dar', city: 'Bahir Dar', region: 'Amhara', type: 'house', listingType: 'sale', price: 8500000, bedrooms: 4, bathrooms: 3, kitchens: 2, parking: 2, area: 250, status: 'published', featured: false, lat: 11.59, lng: 37.39, imageCount: 4 },
    { title: 'Lake View Villa in Hawassa', city: 'Hawassa', region: 'Sidama', type: 'villa', listingType: 'sale', price: 18000000, bedrooms: 4, bathrooms: 3, kitchens: 1, parking: 2, area: 320, status: 'published', featured: true, lat: 7.05, lng: 38.47, imageCount: 4 },
    { title: 'Affordable Apartment in Mekelle', city: 'Mekelle', region: 'Tigray', type: 'apartment', listingType: 'rent', price: 35000, bedrooms: 2, bathrooms: 1, kitchens: 1, parking: 1, area: 70, status: 'pending_review', featured: false, lat: 13.49, lng: 39.47, imageCount: 2 },
    { title: 'Land for Sale in Sululta', city: 'Addis Ababa', region: 'Oromia', type: 'land', listingType: 'sale', price: 4500000, bedrooms: 0, bathrooms: 0, kitchens: 0, parking: 0, area: 500, status: 'published', featured: false, lat: 9.15, lng: 38.8, imageCount: 2 },
    { title: 'Office Space in Dire Dawa', city: 'Dire Dawa', region: 'Dire Dawa', type: 'commercial-unit', listingType: 'rent', price: 75000, bedrooms: 0, bathrooms: 2, kitchens: 1, parking: 5, area: 150, status: 'pending_review', featured: false, lat: 9.6, lng: 41.85, imageCount: 3 },
    { title: 'Renovated House in Gullele', city: 'Addis Ababa', region: 'Addis Ababa', type: 'house', listingType: 'sale', price: 12000000, bedrooms: 3, bathrooms: 2, kitchens: 1, parking: 1, area: 160, status: 'published', featured: false, lat: 9.05, lng: 38.73, imageCount: 3 },
    { title: 'Modern Studio in CMC', city: 'Addis Ababa', region: 'Addis Ababa', type: 'studio', listingType: 'rent', price: 32000, bedrooms: 1, bathrooms: 1, kitchens: 1, parking: 0, area: 40, status: 'published', featured: false, lat: 9.02, lng: 38.82, imageCount: 2 },
    { title: 'Villa with Garden in Bole', city: 'Addis Ababa', region: 'Addis Ababa', type: 'villa', listingType: 'rent', price: 150000, bedrooms: 4, bathrooms: 3, kitchens: 2, parking: 2, area: 380, status: 'draft', featured: false, lat: 9.03, lng: 38.78, imageCount: 3 },
    { title: 'Residential Plot in Hawassa', city: 'Hawassa', region: 'Sidama', type: 'land', listingType: 'sale', price: 2200000, bedrooms: 0, bathrooms: 0, kitchens: 0, parking: 0, area: 350, status: 'draft', featured: false, lat: 7.06, lng: 38.48, imageCount: 2 },
    { title: 'Apartment Near Stadium', city: 'Bahir Dar', region: 'Amhara', type: 'apartment', listingType: 'rent', price: 30000, bedrooms: 2, bathrooms: 1, kitchens: 1, parking: 1, area: 75, status: 'rejected', featured: false, lat: 11.6, lng: 37.38, imageCount: 2 },
    { title: 'Chalet in Gondar', city: 'Gondar', region: 'Amhara', type: 'house', listingType: 'sale', price: 6500000, bedrooms: 3, bathrooms: 2, kitchens: 1, parking: 1, area: 210, status: 'published', featured: false, lat: 12.6, lng: 37.46, imageCount: 3 },
    { title: 'Penthouse in Adama', city: 'Adama', region: 'Oromia', type: 'apartment', listingType: 'rent', price: 95000, bedrooms: 3, bathrooms: 2, kitchens: 1, parking: 2, area: 140, status: 'rented', featured: false, lat: 8.54, lng: 39.27, imageCount: 3 },
    { title: 'Sold Commercial Space', city: 'Mekelle', region: 'Tigray', type: 'commercial-unit', listingType: 'sale', price: 30000000, bedrooms: 0, bathrooms: 2, kitchens: 1, parking: 6, area: 400, status: 'sold', featured: false, lat: 13.5, lng: 39.48, imageCount: 3 },
    { title: 'Affordable House in Arba Minch', city: 'Arba Minch', region: 'SNNPR', type: 'house', listingType: 'sale', price: 3200000, bedrooms: 2, bathrooms: 1, kitchens: 1, parking: 1, area: 100, status: 'pending_review', featured: false, lat: 6.04, lng: 37.55, imageCount: 2 },
    { title: 'Family Villa in Adama', city: 'Adama', region: 'Oromia', type: 'villa', listingType: 'sale', price: 15000000, bedrooms: 4, bathrooms: 3, kitchens: 2, parking: 2, area: 300, status: 'published', featured: false, lat: 8.55, lng: 39.28, imageCount: 4 },
  ];

  const properties = [];
  for (const pt of propertyTemplates) {
    const catId = categoryMap.get(
      pt.type === 'house' ? 'Residential House' :
      pt.type === 'apartment' ? 'Apartment' :
      pt.type === 'villa' ? 'Villa' :
      pt.type === 'studio' ? 'Studio' :
      pt.type === 'land' ? 'Land Plot' : 'Commercial Unit'
    )!;

    // Pick relevant amenities
    let amenityIds: mongoose.Types.ObjectId[] = [];
    if (pt.type === 'house' || pt.type === 'villa') {
      amenityIds = [amenityMap.get('Parking')!, amenityMap.get('Security Guard')!, amenityMap.get('Garden')!, amenityMap.get('24/7 Electricity')!];
    } else if (pt.type === 'apartment' || pt.type === 'studio') {
      amenityIds = [amenityMap.get('Security Guard')!, amenityMap.get('Water Supply')!, amenityMap.get('Internet')!, amenityMap.get('Elevator')!];
    } else if (pt.type === 'commercial-unit') {
      amenityIds = [amenityMap.get('Parking')!, amenityMap.get('Generator Backup')!, amenityMap.get('Security Guard')!, amenityMap.get('Elevator')!];
    } else if (pt.type === 'land') {
      amenityIds = [amenityMap.get('Water Supply')!, amenityMap.get('Solar Power')!];
    }

    const images = Array.from({ length: pt.imageCount }, (_, i) => ({
      url: `https://res.cloudinary.com/demo/image/upload/v170000000${i + 1}/househub/${pt.city.toLowerCase().replace(/[^a-z]/g, '')}-${pt.type}-${i + 1}.jpg`,
      publicId: `househub/${pt.city.toLowerCase().replace(/[^a-z]/g, '')}-${pt.type}-${i + 1}`,
    }));

    // Assign owner: mix of agents and some regular users
    const ownerPool = pt.status === 'published' || pt.status === 'rented' || pt.status === 'sold'
      ? [...agentUserIds, ...regularUserIds.slice(0, 2)]
      : agentUserIds;
    const ownerId = ownerPool[Math.floor(Math.random() * ownerPool.length)];

    const prop = await Property.create({
      title: pt.title,
      description: `A well-maintained ${pt.type} located in ${pt.city}, ${pt.region}. This ${pt.listingType === 'rent' ? 'rental' : 'sale'} property offers ${pt.bedrooms} bedrooms, ${pt.bathrooms} bathrooms, and spans ${pt.area} square meters. Ideal for families and professionals looking for comfort and convenience in one of Ethiopia\'s vibrant cities.`,
      propertyType: pt.type,
      category: catId,
      listingType: pt.listingType as 'rent' | 'sale',
      price: pt.price,
      bedrooms: pt.bedrooms,
      bathrooms: pt.bathrooms,
      kitchens: pt.kitchens,
      parking: pt.parking,
      area: pt.area,
      address: `${Math.floor(Math.random() * 900) + 10} ${pt.city} Main Street`,
      city: pt.city,
      region: pt.region,
      location: { lat: pt.lat, lng: pt.lng },
      amenities: amenityIds.slice(0, 4),
      images,
      featured: pt.featured,
      status: pt.status as any,
      owner: ownerId,
    });
    properties.push(prop);
  }
  console.log(`🏠 Inserted ${properties.length} properties`);
  const publishedProperties = properties.filter((p) => (p as any).status === 'published');
  const pendingProperties = properties.filter((p) => (p as any).status === 'pending_review');

  // 8. Reviews
  const reviewComments = [
    'በጣም ጥሩ ንብረት ነው። ቤቱ እንደተገለጸው ሁሉም ነገር በጣም ጥሩ ነው።',
    'Excellent location and very clean. Would recommend to friends.',
    'The property is good but the road access is a bit rough.',
    'I loved the neighborhood. Very calm and secure.',
    'ቦታው በጣም ጥሩ ነው ነገርግን ንብረቱ በጣም ማደስ ይፈልጋል።',
    'Great value for the price. Spacious and bright.',
    'The owner was very cooperative throughout the process.',
    'Average experience. Nothing too special but decent.',
    'የሚከራዩት ሰው በጣም ጥሩ ንብረት አሳድጓል። አመሰግናለሁ።',
    'Perfect for a small family. Quiet area with good schools nearby.',
    'The apartment needs some painting but overall okay.',
    'ቤቱ በጣም አሪፍ ነው። ለማከራየት በጣም ጥሩ ነው።',
  ];

  const reviews = [];
  for (const prop of publishedProperties.slice(0, 12)) {
    // Each reviewed by 1-2 regular users who are NOT the owner
    const eligibleReviewers = regularUserIds.filter((id) => id.toString() !== (prop as any).owner.toString());
    const shuffled = eligibleReviewers.sort(() => Math.random() - 0.5);
    const count = 1 + Math.floor(Math.random() * 2); // 1 or 2 reviews
    for (let i = 0; i < count && i < shuffled.length; i++) {
      const rating = 3 + Math.floor(Math.random() * 3); // 3-5 weighted
      const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
      try {
        const review = await Review.create({
          property: prop._id,
          user: shuffled[i],
          rating,
          comment,
        });
        reviews.push(review);
      } catch (err) {
        // skip duplicate unique-index hits
      }
    }
  }
  console.log(`⭐ Inserted ${reviews.length} reviews`);

  // 9. Messages
  const messageSubjects = [
    'Inquiry about property',
    'ስለ ንብረቱ ጥያቄ',
    'Request for viewing',
    'ተጨማሪ መረጃ እፈልጋለሁ',
    'Price negotiation',
    'ስለ ዋጋው ውይይት',
  ];
  const messageBodies = [
    'I am very interested in this property. Is it still available?',
    'ስለ ንብረቱ ተጨማሪ መረጃ እንድትሰጡኝ እፈልጋለሁ።',
    'Can I schedule a visit this week? I am available on weekends.',
    'ምን ያህል ነው የማከራየት ዋጋው? እባክዎን ይረዱኝ።',
    'Does the price include utilities and maintenance fees?',
    'The location looks perfect for my family. What is the nearest school?',
  ];

  const messages = [];
  for (let i = 0; i < 25; i++) {
    const prop = publishedProperties[Math.floor(Math.random() * publishedProperties.length)];
    const sender = regularUserIds[Math.floor(Math.random() * regularUserIds.length)];
    const receiver = sender.toString() === (prop as any).owner.toString()
      ? regularUserIds[Math.floor(Math.random() * regularUserIds.length)]
      : (prop as any).owner;

    const msg = await Message.create({
      property: prop._id,
      sender,
      receiver,
      subject: messageSubjects[Math.floor(Math.random() * messageSubjects.length)],
      message: messageBodies[Math.floor(Math.random() * messageBodies.length)],
      read: i < 5, // first 5 are read, rest unread
    });
    messages.push(msg);
  }
  console.log(`💬 Inserted ${messages.length} messages`);

  // 10. Favorites
  const favorites = [];
  for (let i = 0; i < 15; i++) {
    const prop = properties[Math.floor(Math.random() * properties.length)];
    const user = regularUserIds[Math.floor(Math.random() * regularUserIds.length)];
    try {
      const fav = await Favorite.create({
        user,
        property: prop._id,
      });
      favorites.push(fav);
    } catch (err) {
      // skip duplicates
    }
  }
  console.log(`❤️ Inserted ${favorites.length} favorites`);

  // 11. Notifications
  const notificationTypes = ['message', 'review', 'property_status', 'system'] as const;
  const notificationData: any[] = [];
  const allTargetUsers = [adminUserId, ...regularUserIds, ...agentUserIds];

  for (let i = 0; i < 30; i++) {
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const user = allTargetUsers[Math.floor(Math.random() * allTargetUsers.length)];
    let title = '';
    let message = '';
    let relatedProp: mongoose.Types.ObjectId | undefined;
    let relatedStatus: string | undefined;

    if (type === 'message') {
      title = 'New message received';
      message = 'ስለ ንብረትዎ አዲስ መልዕክት ደረሰዎት።';
      relatedProp = (messages[Math.floor(Math.random() * messages.length)] as any).property;
    } else if (type === 'review') {
      title = 'New review on your property';
      message = 'አንድ አታላይ ስለ ንብረትዎ አዲስ ግምገማ አስቀምጧል።';
      relatedProp = (reviews[Math.floor(Math.random() * reviews.length)] as any).property;
      relatedStatus = 'published';
    } else if (type === 'property_status') {
      title = 'Property status updated';
      message = 'የንብረትዎ ሁኔታ ተሻሽሏል።';
      const prop = properties[Math.floor(Math.random() * properties.length)];
      relatedProp = prop._id;
      relatedStatus = (prop as any).status;
    } else {
      title = 'Welcome to HouseHub';
      message = 'ሂወትዎን በመቀየር የቤት እና የሱቅ እንዲገንዘቡ እንወዳለን!';
    }

    notificationData.push({
      user,
      type,
      title,
      message,
      read: i < 8,
      relatedProperty: relatedProp,
      relatedPropertyStatus: relatedStatus,
    });
  }

  const notifications = await Notification.insertMany(notificationData);
  console.log(`🔔 Inserted ${notifications.length} notifications`);

  // 12. Contact Inquiries
  const contactInquiries = await ContactInquiry.insertMany([
    { name: 'Ethiopian Airlines', email: 'procurement@ethiopianairlines.com', phone: '+251116172580', message: 'We are looking for commercial office space near Bole for our regional office.' },
    { name: 'Marta Alemu', email: 'marta.alemu@gmail.com', phone: '+251911223344', message: 'I need a 2-bedroom apartment near Bole. Budget is up to 50,000 ETB.' },
    { name: 'Berhan Bank', email: 'info@berhanbank.com', phone: '+251111223344', message: 'Interested in purchasing a commercial building in Addis Ababa for our new branch.' },
    { name: 'Kebede Bekele', email: 'kebede.bekele@yahoo.com', phone: '+251933456789', message: 'ስለ ንብረቶቼ ማስታወሻ እፈልጋለሁ።' },
    { name: 'Sara Tekle', email: 'sara.t@gmail.com', phone: '+251911987654', message: 'Looking for a studio apartment in Addis Ababa for rent.' },
    { name: 'Dashen Bank', email: 'hr@dashenbank.com', phone: '+251911234567', message: 'We need multiple residential units for our employees in Adama.' },
    { name: 'Abiy Ahmed', email: 'abiy.a@outlook.com', phone: '+251922345678', message: 'Interested in land plots in Hawassa for a hotel project.' },
    { name: 'Tigist Haile', email: 'tigist.h@yahoo.com', phone: '+251922345678', message: 'እባክዎን በሱቅ ንብረት ላይ ተጨማሪ መረጃ እንድትሰጡኝ እፈልጋለሁ።' },
  ]);
  console.log(`📬 Inserted ${contactInquiries.length} contact inquiries`);

  // 13. Summary
  console.log('\n✅ Seed completed!\n');
  console.log('📊 Summary:');
  console.log(`   Categories:       ${categories.length}`);
  console.log(`   Amenities:        ${amenities.length}`);
  console.log(`   Users:            ${users.length}`);
  console.log(`   Properties:       ${properties.length}`);
  console.log(`   Reviews:          ${reviews.length}`);
  console.log(`   Messages:         ${messages.length}`);
  console.log(`   Favorites:        ${favorites.length}`);
  console.log(`   Notifications:    ${notifications.length}`);
  console.log(`   ContactInquiries: ${contactInquiries.length}`);
  console.log('\n🔑 Test login credentials:');
  console.log('   Admin:  admin@househub.et / Admin@123');
  console.log('   Agents: abe.bikila@househub.et / agent123  (or similar based on email format above)');
  console.log('   Users:  sara.tekle@gmail.com / password123');
  console.log('\n🚀 Next steps:');
  console.log('   1. Visit /api/init as admin to create geospatial index');
  console.log('   2. Open the app and explore seeded data');
  console.log('   3. Login with test credentials');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
    process.exit(0);
  });
