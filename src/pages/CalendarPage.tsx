import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ViewToggle from '@/components/calendar/ViewToggle';
import FilterPanel from '@/components/calendar/FilterPanel';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import BookingForm from '@/components/booking/BookingForm';
import type { ViewMode } from '@/types';

// 泊位日历页
export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [highlightBookingId, setHighlightBookingId] = useState<string | null>(null);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const highlightParam = searchParams.get('highlight');
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) setCurrentDate(d);
    }
    if (highlightParam) {
      setHighlightBookingId(highlightParam);
      const t = setTimeout(() => {
        setHighlightBookingId(null);
        const next = new URLSearchParams(searchParams);
        next.delete('highlight');
        setSearchParams(next, { replace: true });
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">泊位日历</h1>
          <p className="mt-1 text-sm text-slate-400">拖拽预约卡片调整靠泊安排，检测冲突自动提示</p>
        </div>
        <button
          type="button"
          onClick={() => setShowBookingForm(true)}
          className="flex items-center gap-2 rounded-lg bg-port-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-port-600/20 transition-all hover:bg-port-500 hover:shadow-port-500/30"
        >
          <Plus className="h-4 w-4" />
          新增预约
        </button>
      </div>

      <ViewToggle
        viewMode={viewMode}
        currentDate={currentDate}
        onViewModeChange={setViewMode}
        onDateChange={setCurrentDate}
      />

      <FilterPanel />

      <div className="flex-1 min-h-0">
        <CalendarGrid viewMode={viewMode} currentDate={currentDate} highlightBookingId={highlightBookingId} />
      </div>

      <BookingForm open={showBookingForm} onClose={() => setShowBookingForm(false)} />
    </div>
  );
}
