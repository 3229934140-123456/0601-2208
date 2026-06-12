import { Search, Anchor, ChevronLeft, ChevronRight, Plus, FileDown, CalendarClock } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/types';

export interface PlanToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: BookingStatus | 'all';
  onStatusChange: (value: BookingStatus | 'all') => void;
  date: Date;
  onDateChange: (value: Date) => void;
  onAddBooking: () => void;
  onExport: () => void;
}

const STATUS_OPTIONS: Array<{ value: BookingStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'berthed', label: '已靠泊' },
  { value: 'departed', label: '离港' },
];

export default function PlanToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  date,
  onDateChange,
  onAddBooking,
  onExport,
}: PlanToolbarProps) {
  const today = new Date();
  const isToday = isSameDay(date, today);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center gap-3 lg:gap-4">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Anchor className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索船名/船代..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-port-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-port-100"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                status === opt.value
                  ? 'bg-white text-port-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => onDateChange(addDays(date, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDateChange(today)}
              className={cn(
                'h-8 rounded-md px-3 text-xs font-medium transition-colors',
                isToday ? 'bg-port-50 text-port-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              今日
            </button>
            <div className="mx-1 h-4 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-1 px-2 text-xs font-medium text-slate-700">
              <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
              {format(date, 'MM月dd日 EEEE', { locale: zhCN })}
            </span>
            <button
              type="button"
              onClick={() => onDateChange(addDays(date, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onAddBooking}
            className="inline-flex items-center gap-1.5 rounded-lg bg-port-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-port-700"
          >
            <Plus className="h-4 w-4" />
            新增预约
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4" />
            导出
          </button>
        </div>
      </div>
    </div>
  );
}
