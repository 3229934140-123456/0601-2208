import { useState } from "react"
import { Anchor, Bell, ChevronDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePortStore } from "@/store/usePortStore"

export function Header() {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const { notifications, markAllNotificationsRead, markNotificationRead } = usePortStore()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <header
      className={cn(
        "h-14 fixed top-0 w-full z-40",
        "border-b border-port-900/30",
        "bg-gradient-to-r from-port-950 via-port-900 to-slatex-900",
        "flex items-center justify-between px-4 md:px-6"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-port-500/20 flex items-center justify-center">
          <Anchor className="w-5 h-5 text-port-300" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-white font-semibold text-base tracking-wide">
            港航通
          </span>
          <span className="text-port-300/80 text-[11px]">泊位调度系统</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen)
              setUserOpen(false)
            }}
            className="relative p-2 rounded-lg text-port-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card animate-fade-in-down overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-medium text-sm">消息通知</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-port-300 text-xs hover:text-port-200"
                  >
                    全部已读
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-slatex-700 text-sm">
                    暂无消息
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markNotificationRead(n.id)}
                      className={cn(
                        "px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors",
                        !n.isRead && "bg-port-500/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-port-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white text-sm font-medium truncate">
                              {n.title}
                            </span>
                          </div>
                          <p className="text-port-200/70 text-xs mt-0.5 line-clamp-2">
                            {n.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setUserOpen(!userOpen)
              setNotifOpen(false)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-port-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-port-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-port-200" />
            </div>
            <span className="hidden md:inline text-sm">调度员张三</span>
            <ChevronDown className="w-4 h-4 hidden md:block" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 glass-card animate-fade-in-down overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-white text-sm font-medium">张三</p>
                <p className="text-port-300/70 text-xs">调度中心 · 主任调度员</p>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-port-100 hover:bg-white/5 hover:text-white transition-colors">
                  个人设置
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-port-100 hover:bg-white/5 hover:text-white transition-colors">
                  切换角色
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors border-t border-white/5 mt-1 pt-2">
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
