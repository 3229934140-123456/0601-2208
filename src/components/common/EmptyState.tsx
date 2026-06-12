import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  className?: string
  iconClassName?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function EmptyState({
  icon,
  title,
  subtitle,
  className,
  iconClassName,
  titleClassName,
  subtitleClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 px-4 text-center",
        className
      )}
    >
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
          "bg-slatex-850/60 border border-port-900/30",
          iconClassName
        )}
      >
        {icon}
      </div>
      <h3
        className={cn(
          "text-base font-medium text-port-100 mb-1",
          titleClassName
        )}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          className={cn(
            "text-sm text-port-300/60 max-w-xs leading-relaxed",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
