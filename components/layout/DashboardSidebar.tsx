"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  PlusCircle,
  Heart,
  MessageSquare,
  User,
  Settings,
  Menu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DashboardLink {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: boolean;
  exact?: boolean;
}

const DASHBOARD_LINKS: DashboardLink[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/properties",
    label: "My Listings",
    icon: Home,
  },
  {
    href: "/dashboard/properties/new",
    label: "Add Property",
    icon: PlusCircle,
    exact: true,
  },
  {
    href: "/dashboard/favorites",
    label: "Favorites",
    icon: Heart,
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: MessageSquare,
    badge: true,
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: User,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

function SidebarNav({
  unreadMessages,
  onNavigate,
}: {
  unreadMessages: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (link: DashboardLink) => {
    if (link.exact || link.href === "/dashboard") return pathname === link.href;
    if (link.href === "/dashboard/properties") {
      return (pathname === "/dashboard/properties" || pathname.startsWith("/dashboard/properties/")) && pathname !== "/dashboard/properties/new";
    }
    return pathname === link.href || pathname.startsWith(link.href + "/");
  };

  return (
    <nav className="p-4 space-y-1">
      {DASHBOARD_LINKS.map((link) => {
        const Icon = link.icon;
        const active = isActive(link);
        const showBadge = link.badge && unreadMessages > 0;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
          >
            <span className="flex items-center">
              <Icon className="mr-3 h-5 w-5" />
              {link.label}
            </span>
            {showBadge && (
              <Badge variant="destructive" className="ml-auto">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar() {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/messages/unread-count")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUnreadMessages(data.data.count);
      })
      .catch(() => console.error("Failed to fetch message count"));
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-border bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        <SidebarNav unreadMessages={unreadMessages} />
      </aside>

      {/* Mobile trigger */}
      <div className="lg:hidden fixed bottom-4 left-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="px-4 py-3 border-b border-border">
              <SheetTitle>Dashboard</SheetTitle>
            </SheetHeader>
            <SidebarNav
              unreadMessages={unreadMessages}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
