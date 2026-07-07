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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardLink {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: boolean;
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    fetch("/api/messages/unread-count")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUnreadMessages(data.data.count);
        }
      })
      .catch((err) => console.error("Failed to fetch message count:", err));
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-border bg-background h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {DASHBOARD_LINKS.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const showBadge = link.badge && unreadMessages > 0;

          return (
            <Link
              key={link.href}
              href={link.href}
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
    </aside>
  );
}
