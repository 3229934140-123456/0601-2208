import { Package2, Mountain, Droplets, Flame, Boxes } from "lucide-react"
import type { CargoType } from "@/types"
import { cn } from "@/lib/utils"

const cargoConfig: Record<
  CargoType,
  { icon: typeof Package2; label: string; color: string }
> = {
  container: { icon: Package2, label: "集装箱", color: "text-port-300" },
  bulk: { icon: Mountain, label: "散货", color: "text-amber-300" },
  liquid: { icon: Droplets, label: "液体货", color: "text-sky-300" },
  gas: { icon: Flame, label: "气体货", color: "text-rose-300" },
  general: { icon: Boxes, label: "杂货", color: "text-emerald-300" },
}

interface CargoIconProps {
  type: CargoType
  showLabel?: boolean
  className?: string
  iconClassName?: string
}

export function CargoIcon({
  type,
  showLabel = false,
  className,
  iconClassName,
}: CargoIconProps) {
  const cfg = cargoConfig[type] || cargoConfig.general
  const Icon = cfg.icon

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon
        className={cn("w-4 h-4 shrink-0", cfg.color, iconClassName)}
      />
      {showLabel && (
        <span className={cn("text-xs", cfg.color)}>{cfg.label}</span>
      )}
    </span>
  )
}
