import { NavLink } from "react-router-dom"
import { LayoutDashboard, Ship, CalendarDays, BellRing } from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "排队看板" },
  { to: "/plans", icon: Ship, label: "船舶计划" },
  { to: "/calendar", icon: CalendarDays, label: "泊位日历" },
  { to: "/notifications", icon: BellRing, label: "通知中心" },
]

export function Sidebar() {
  return (
    <aside
      className={cn(
        "pl-16 mt-14 fixed left-0 top-0",
        "h-[calc(100vh-3.5rem)] w-14 md:w-56",
        "bg-slatex-900/60 backdrop-blur",
        "border-r border-port-900/30",
        "flex flex-col py-4"
      )}
    >
      <nav className="flex flex-col gap-1 px-2 md:px-3">
        {menuItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-port-900/60 text-port-300 border-l-2 border-port-400 pl-2 md:pl-2"
                  : "text-port-200/60 hover:text-port-100 hover:bg-white/5 border-l-2 border-transparent pl-2 md:pl-2"
              )
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="hidden md:block truncate">{label}</span>
            <span className="md:hidden absolute left-full ml-3 px-2 py-1 rounded bg-slatex-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3 pb-2">
        <div className="hidden md:block px-3 py-2 rounded-lg bg-port-900/30 border border-port-800/40">
          <p className="text-port-300/60 text-[11px] leading-relaxed">
            当前调度轮次
          </p>
          <p className="text-port-200 text-xs font-medium mt-0.5">
            D 班 · 夜班 00:00-08:00
          </p>
        </div>
      </div>
    </aside>
  )
}
