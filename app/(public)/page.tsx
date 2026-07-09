import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Home, TrendingUp, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/home/SearchBar";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { connectDB } from "@/lib/db";
import { Property, Category } from "@/models";

export const dynamic = 'force-dynamic';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  propertyCount?: number;
}

interface Stats {
  totalProperties: number;
  totalCities: number;
  totalAgents: number;
  totalCategories: number;
}

interface PopularCity {
  _id: string;
  count: number;
}

async function getFeaturedProperties() {
  try {
    await connectDB();
    const properties = await Property.find({ status: 'published', featured: true })
      .sort({ createdAt: -1 }).limit(6)
      .populate('category', 'name slug')
      .populate('owner', 'name avatar').lean();
    return JSON.parse(JSON.stringify(properties));
  } catch { return []; }
}

async function getLatestProperties() {
  try {
    await connectDB();
    const properties = await Property.find({ status: 'published' })
      .sort({ createdAt: -1 }).limit(6)
      .populate('category', 'name slug')
      .populate('owner', 'name avatar').lean();
    return JSON.parse(JSON.stringify(properties));
  } catch { return []; }
}

async function getCategories() {
  try {
    await connectDB();
    const categories = await Category.find({}).lean();
    return JSON.parse(JSON.stringify(categories));
  } catch { return []; }
}

async function getStats() {
  try {
    await connectDB();
    const [totalProperties, totalCategories, ownerIds, cityIds] = await Promise.all([
      Property.countDocuments({ status: 'published' }),
      Category.countDocuments({}),
      Property.distinct('owner', { status: 'published' }),
      Property.distinct('city', { status: 'published' }),
    ]);
    return { totalProperties, totalCategories, totalAgents: ownerIds.length, totalCities: cityIds.length };
  } catch { return null; }
}

async function getPopularCities() {
  try {
    await connectDB();
    return await Property.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
  } catch { return []; }
}

const TESTIMONIALS = [
  {
    id: 1,
    name: "Amanuel Tadesse",
    role: "Homeowner",
    content:
      "I found my dream home through HouseHub in just two weeks. The platform made it easy to search and connect with property owners.",
  },
  {
    id: 2,
    name: "Sara Kebede",
    role: "Real Estate Agent",
    content:
      "As an agent, HouseHub has helped me reach more clients and close deals faster. The messaging system is particularly helpful.",
  },
  {
    id: 3,
    name: "Dawit Mengistu",
    role: "Property Owner",
    content:
      "Listing my property was straightforward and I started receiving inquiries within days. Highly recommended!",
  },
];

export default async function HomePage() {
  const [
    featuredProperties,
    latestProperties,
    categories,
    stats,
    popularCities,
  ] = await Promise.all([
    getFeaturedProperties(),
    getLatestProperties(),
    getCategories(),
    getStats(),
    getPopularCities(),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h1 className="font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl lg:text-6xl">
                Find Your Perfect
                <br />
                <span className="text-primary">Home in Ethiopia</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Discover thousands of properties for rent and sale. Connect
                directly with owners and agents across the country.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/properties">
                    Browse Properties
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard/properties/new">
                    List Your Property
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[300px] lg:h-[500px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                alt="Modern apartment building"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-primary/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-12">
          <SearchBar />
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section className="border-b border-border bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold text-foreground">
                  Featured Properties
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Hand-picked premium listings
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/properties?featured=true">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <PropertyGrid properties={featuredProperties.slice(0, 6)} />
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-b border-border bg-muted/20 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="font-display text-3xl font-semibold text-foreground">
                Browse by Category
              </h2>
              <p className="mt-2 text-muted-foreground">
                Find properties that match your needs
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category: Category) => (
                <Link
                  key={category._id}
                  href={`/properties?category=${category.slug}`}
                  className="group"
                >
                  <Card className="transition-all hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                        {category.propertyCount !== undefined && (
                          <Badge
                            variant="secondary"
                            className="font-data tabular-nums"
                          >
                            {category.propertyCount}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Properties */}
      {latestProperties.length > 0 && (
        <section className="border-b border-border bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold text-foreground">
                  Latest Listings
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Newly added properties
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/properties?sort=latest">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <PropertyGrid properties={latestProperties.slice(0, 6)} />
          </div>
        </section>
      )}

      {/* Popular Cities */}
      {popularCities.length > 0 && (
        <section className="border-b border-border bg-muted/20 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="font-display text-3xl font-semibold text-foreground">
                Popular Cities
              </h2>
              <p className="mt-2 text-muted-foreground">
                Explore properties in top locations
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {popularCities.map((city: PopularCity) => (
                <Link
                  key={city._id}
                  href={`/properties?city=${city._id}`}
                  className="group"
                >
                  <Card className="transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {city._id}
                        </p>
                        <p className="font-data tabular-nums text-sm text-muted-foreground">
                          {city.count}{" "}
                          {city.count === 1 ? "listing" : "listings"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Statistics */}
      {stats && (
        <section className="border-b border-border bg-primary/5 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              <div className="text-center">
                <p className="font-data tabular-nums text-4xl font-semibold text-primary">
                  {stats.totalProperties.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Published Properties
                </p>
              </div>
              <div className="text-center">
                <p className="font-data tabular-nums text-4xl font-semibold text-primary">
                  {stats.totalCities.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cities Covered
                </p>
              </div>
              <div className="text-center">
                <p className="font-data tabular-nums text-4xl font-semibold text-primary">
                  {stats.totalAgents.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Active Agents
                </p>
              </div>
              <div className="text-center">
                <p className="font-data tabular-nums text-4xl font-semibold text-primary">
                  {stats.totalCategories.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Property Categories
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="border-b border-border bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-foreground">
              What Our Users Say
            </h2>
            <p className="mt-2 text-muted-foreground">
              Real experiences from homeowners and agents
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="p-6">
                  <p className="text-muted-foreground italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="font-semibold text-foreground">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-semibold text-primary-foreground md:text-4xl">
            Ready to Find Your Home?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90">
            Browse thousands of properties or list your own today
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/properties?listingType=rent">
                <Home className="mr-2 h-5 w-5" />
                Browse Rentals
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/properties?listingType=sale">
                <TrendingUp className="mr-2 h-5 w-5" />
                Browse Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
