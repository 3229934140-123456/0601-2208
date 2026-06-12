import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/types';

interface ViewToggleProps {
  viewMode: ViewMode;
  currentDate: Date;
  onViewModeChange: (mode: ViewMode) => void;
  onDateChange: (date: Date) => void;
}

// 周/日视图切换 + 日期导航
export default function ViewToggle({
  viewMode,
  currentDate,
  onViewModeChange,
  onDateChange,
}: ViewToggleProps) {
  const handlePrev = () => {
    if (viewMode === 'week') {
      onDateChange(addDays(currentDate, -7));
    } else {
      onDateChange(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      onDateChange(addDays(currentDate, 7));
    } else {
      onDateChange(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateRangeText = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1, locale: zhCN });
      const end = endOfWeek(currentDate, { weekStartsOn: 1, locale: zhCN });
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'yyyy年M月d日')} - ${format(end, 'd日')}`;
      }
      return `${format(start, 'yyyy年M月d日')} - ${format(end, 'M月d日')}`;
    }
    return format(currentDate, 'yyyy年M月d日 EEEE', { locale: zhCN });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handlePrev}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slatex-800 text-slate-300 transition-colors hover:bg-slatex-700 hover:text-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 rounded-lg bg-slatex-800 px-3 py-1.5">
        <button
          type="button"
          onClick={handleToday}
          className="rounded px-2 py-0.5 text-sm text-port-400 transition-colors hover:bg-slatex-700 hover:text-port-300"
        >
          今天
        </button>
        <span className="h-4 w-px bg-slate-600" />
        <span className="min-w-[200px] text-center text-sm font-medium text-slate-100">
          {getDateRangeText()}
        </span>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slatex-800 text-slate-300 transition-colors hover:bg-slatex-700 hover:text-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="ml-2 flex overflow-hidden rounded-lg border border-slate-700 bg-slatex-800">
        <button
          type="button"
          onClick={() => onViewModeChange('week')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-all',
            viewMode === 'week'
              ? 'bg-port-600 text-white shadow-inner'
              : 'text-slate-300 hover:bg-slatex-700',
          )}
        >
          周视图
        </button>
        <div className="w-px bg-slate-700" />
        <button
          type="button"
          onClick={() => onViewModeChange('day')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-all',
            viewMode === 'day'
              ? 'bg-port-600 text-white shadow-inner'
              : 'text-slate-300 hover:bg-slatex-700',
          )}
        >
          日视图
        </button>
      </div>
    </div>
  );
}
