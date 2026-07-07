import { formatBirr } from "@/lib/format"
import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  type: 'rent' | 'sale'
  className?: string
}

export function PriceDisplay({ price, type, className }: PriceDisplayProps) {
  return (
    <p className={cn("font-data tabular-nums text-lg", className)}>
      {formatBirr(price)}
      {type === "rent" && (
        <span className="font-body text-muted-foreground text-sm"> /mo</span>
      )}
    </p>
  )
}
