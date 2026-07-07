import { Metadata } from "next";
import { Home, Users, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us - HouseHub",
  description:
    "Learn about HouseHub, Ethiopia's trusted platform for finding and listing houses for rent and sale.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
          About HouseHub
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          We're on a mission to make finding and listing properties in Ethiopia
          simple, transparent, and accessible to everyone.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto mb-16">
        <Card>
          <CardContent className="p-8">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              HouseHub was created to address the challenges of finding quality
              housing in Ethiopia. We believe everyone deserves a straightforward
              way to discover their ideal home or connect with potential tenants
              and buyers. By bringing property owners, agents, and seekers
              together on one platform, we're transforming the Ethiopian real
              estate experience.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Values */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="font-display text-3xl font-semibold text-foreground text-center mb-12">
          What We Stand For
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Trust</h3>
              <p className="text-sm text-muted-foreground">
                Verified listings and secure processes you can rely on
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Home className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Simplicity</h3>
              <p className="text-sm text-muted-foreground">
                Easy-to-use platform that gets you results fast
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">
                Connecting Ethiopians across cities and regions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Growth</h3>
              <p className="text-sm text-muted-foreground">
                Empowering property owners and agents to succeed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Story */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
              Our Story
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Founded in 2024, HouseHub emerged from a simple observation: finding
                quality housing in Ethiopia shouldn't be difficult. Whether you're
                searching for your first apartment in Addis Ababa, looking to rent
                out your property in Bahir Dar, or helping clients find their dream
                home as an agent, the process should be straightforward.
              </p>
              <p>
                Today, HouseHub serves thousands of users across Ethiopia,
                connecting property seekers with owners and agents in cities and
                towns throughout the country. Our platform handles everything from
                studio apartments to luxury villas, from urban centers to emerging
                neighborhoods.
              </p>
              <p>
                We're just getting started. As Ethiopia's real estate market
                evolves, we're committed to building tools and features that make
                property transactions smoother, safer, and more accessible for
                everyone involved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
