"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBirr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  Send,
  RefreshCw,
  Home,
  AlertCircle,
} from "lucide-react";

type PropertyStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "rented"
  | "sold"
  | "archived";

interface Property {
  _id: string;
  title: string;
  price: number;
  listingType: "rent" | "sale";
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  status: PropertyStatus;
  images: { url: string; publicId: string }[];
  featured?: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface PropertiesResponse {
  success: boolean;
  data: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
] as const;

const STATUS_COLORS: Record<PropertyStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-accent text-accent-foreground",
  published: "bg-primary text-primary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  rented: "bg-muted text-muted-foreground",
  sold: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
  rejected: "Rejected",
  rented: "Rented",
  sold: "Sold",
  archived: "Archived",
};

export default function MyListingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProperties = async (status: string, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (status !== "all") {
        params.append("status", status);
      }

      const response = await fetch(`/api/properties/my?${params}`);
      const data: PropertiesResponse = await response.json();

      if (data.success) {
        setProperties(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch properties");
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      toast.error("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(activeTab, 1);
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    fetchProperties(activeTab, page);
  };

  const handleSubmitForReview = async (propertyId: string) => {
    setActionLoading(propertyId);
    try {
      const response = await fetch(`/api/properties/${propertyId}/submit`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Property submitted for review");
        fetchProperties(activeTab, pagination.page);
      } else {
        toast.error(data.error || "Failed to submit property");
      }
    } catch (error) {
      console.error("Failed to submit property:", error);
      toast.error("Failed to submit property");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    setActionLoading(propertyToDelete);
    try {
      const response = await fetch(`/api/properties/${propertyToDelete}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Property deleted successfully");
        fetchProperties(activeTab, pagination.page);
      } else {
        toast.error(data.error || "Failed to delete property");
      }
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property");
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const openDeleteDialog = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setDeleteDialogOpen(true);
  };

  const getPropertyActions = (property: Property) => {
    const actions = [];

    // Edit - available for draft, rejected, or published
    if (["draft", "rejected", "published"].includes(property.status)) {
      actions.push(
        <Button
          key="edit"
          size="sm"
          variant="outline"
          onClick={() => router.push(`/dashboard/properties/${property._id}/edit`)}
          disabled={actionLoading === property._id}
        >
          <Edit className="mr-1 h-3 w-3" />
          Edit
        </Button>
      );
    }

    // Submit for Review - only for draft or rejected
    if (["draft", "rejected"].includes(property.status)) {
      actions.push(
        <Button
          key="submit"
          size="sm"
          onClick={() => handleSubmitForReview(property._id)}
          disabled={actionLoading === property._id}
        >
          <Send className="mr-1 h-3 w-3" />
          {property.status === "rejected" ? "Resubmit" : "Submit for Review"}
        </Button>
      );
    }

    // Delete - available for all except pending_review
    if (property.status !== "pending_review") {
      actions.push(
        <Button
          key="delete"
          size="sm"
          variant="destructive"
          onClick={() => openDeleteDialog(property._id)}
          disabled={actionLoading === property._id}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Delete
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-2">My Listings</h1>
          <p className="text-muted-foreground">
            Manage your property listings
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Home className="mr-2 h-4 w-4" />
            Add New Property
          </Link>
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition-colors",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Properties List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              {activeTab === "all"
                ? "You haven't listed any properties yet"
                : `No ${activeTab.replace("_", " ")} properties`}
            </p>
            <Button asChild>
              <Link href="/dashboard/properties/new">
                <Home className="mr-2 h-4 w-4" />
                Add Your First Property
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {properties.map((property) => (
              <Card key={property._id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Property Image */}
                    <div className="relative h-32 w-32 flex-shrink-0 rounded overflow-hidden bg-muted">
                      {property.images[0] ? (
                        <Image
                          src={property.images[0].url}
                          alt={property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Home className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/properties/${property._id}`}
                            className="font-display text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
                          >
                            {property.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {property.city}
                          </p>
                        </div>
                        <Badge className={cn("ml-2", STATUS_COLORS[property.status])}>
                          {STATUS_LABELS[property.status]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                        <span className="font-data tabular-nums">
                          {property.bedrooms} bed
                        </span>
                        <span className="font-data tabular-nums">
                          {property.bathrooms} bath
                        </span>
                        <span className="font-data tabular-nums">
                          {property.area} m²
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-data tabular-nums text-lg font-semibold">
                            {formatBirr(property.price)}
                            {property.listingType === "rent" && (
                              <span className="font-body text-sm text-muted-foreground ml-1">
                                /mo
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Updated {new Date(property.updatedAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap justify-end">
                          {getPropertyActions(property)}
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {property.status === "rejected" && property.rejectionReason && (
                        <div className="mt-3 p-3 bg-destructive/10 rounded flex gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {property.rejectionReason}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading !== null}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
