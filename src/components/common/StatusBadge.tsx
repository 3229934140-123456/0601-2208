import { cn } from "@/lib/utils"
import type { BookingStatus } from "@/types"

type BadgeStatus = BookingStatus | "available" | "occupied" | "maintenance"

const config: Record<
  BadgeStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  pending: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    dot: "bg-amber-400",
    label: "待确认",
  },
  confirmed: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    label: "已确认",
  },
  berthed: {
    bg: "bg-sky-500/15",
    text: "text-sky-300",
    dot: "bg-sky-400",
    label: "已靠泊",
  },
  departed: {
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    dot: "bg-slate-400",
    label: "已离港",
  },
  cancelled: {
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    dot: "bg-rose-400",
    label: "已取消",
  },
  available: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    label: "空闲",
  },
  occupied: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    dot: "bg-amber-400",
    label: "占用",
  },
  maintenance: {
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    dot: "bg-slate-400",
    label: "维护",
  },
}

interface StatusBadgeProps {
  status: BadgeStatus
  label?: string
  className?: string
  showPulse?: boolean
}

export function StatusBadge({
  status,
  label,
  className,
  showPulse = true,
}: StatusBadgeProps) {
  const c = config[status] || config.pending
  const displayLabel = label ?? c.label

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none",
        "relative before:absolute before:left-1.5 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full",
        c.bg,
        c.text,
        className
      )}
    >
      <span
        className={cn(
          "relative z-10 w-1.5 h-1.5 rounded-full shrink-0",
          c.dot,
          showPulse && "animate-pulse-ring"
        )}
      />
      <span className="relative z-10">{displayLabel}</span>
    </span>
  )
}
