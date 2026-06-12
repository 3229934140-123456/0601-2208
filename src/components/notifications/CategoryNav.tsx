import { Send, Inbox, CheckCircle, RefreshCw, Bell, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortStore } from '@/store/usePortStore';
import type { NotificationCategory } from '@/types';
import { NOTIFICATION_TYPE_LABELS } from '@/types';

interface CategoryNavProps {
  activeCategory: NotificationCategory;
  onCategoryChange: (cat: NotificationCategory) => void;
  onSendClick: () => void;
}

const categories: {
  key: NotificationCategory;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'all', icon: Inbox },
  { key: 'confirm', icon: CheckCircle },
  { key: 'reschedule', icon: RefreshCw },
  { key: 'alert', icon: Bell },
  { key: 'system', icon: Cpu },
];

// 通知分类导航
export default function CategoryNav({
  activeCategory,
  onCategoryChange,
  onSendClick,
}: CategoryNavProps) {
  const { getUnreadCount } = usePortStore();

  return (
    <div className="flex h-full flex-col gap-2">
      <button
        type="button"
        onClick={onSendClick}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-port-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-port-600/20 transition-all hover:bg-port-500 hover:shadow-port-500/30"
      >
        <Send className="h-4 w-4" />
        发送消息
      </button>

      <div className="mt-2 flex flex-col gap-1">
        {categories.map(({ key, icon: Icon }) => {
          const count = getUnreadCount(key);
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onCategoryChange(key)}
              className={cn(
                'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-port-600/20 text-port-300 shadow-inner'
                  : 'text-slate-400 hover:bg-slatex-800 hover:text-slate-200',
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-port-400' : 'text-slate-500 group-hover:text-slate-300',
                  )}
                />
                <span className="font-medium">{NOTIFICATION_TYPE_LABELS[key]}</span>
              </div>
              {count > 0 && (
                <span
                  className={cn(
                    'flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-port-500 text-white' : 'bg-rose-500/90 text-white',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
