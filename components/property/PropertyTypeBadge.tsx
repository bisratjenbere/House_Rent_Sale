import { cn } from "@/lib/utils"

interface PropertyTypeBadgeProps {
  type: 'rent' | 'sale'
  className?: string
}

export function PropertyTypeBadge({ type, className }: PropertyTypeBadgeProps) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-xs font-medium",
        type === "rent" 
          ? "bg-primary text-primary-foreground" 
          : "bg-sale text-sale-foreground",
        className
      )}
    >
      {type === "rent" ? "For Rent" : "For Sale"}
    </span>
  )
}
