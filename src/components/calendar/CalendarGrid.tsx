import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { AlertTriangle, X } from 'lucide-react';
import { eachDayOfInterval, format, startOfWeek, endOfWeek, addDays, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePortStore } from '@/store/usePortStore';
import BookingCard from './BookingCard';
import DayHourCell from './DayHourCell';
import type { Booking, ViewMode, Berth, ConflictInfo } from '@/types';
import { CARGO_LABELS } from '@/types';

interface CalendarGridProps {
  viewMode: ViewMode;
  currentDate: Date;
  highlightBookingId?: string | null;
  focusBerthId?: string | null;
}

// 每个单元格可放置的 Droppable
function DroppableCell({
  id,
  berth,
  dayKey,
  bookingsForSlot,
  viewMode,
  isHoverValid,
  isHoverInvalid,
  highlightBookingId,
}: {
  id: string;
  berth: Berth;
  dayKey: string;
  bookingsForSlot: Booking[];
  viewMode: ViewMode;
  isHoverValid: boolean;
  isHoverInvalid: boolean;
  highlightBookingId?: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const getPositionStyle = (booking: Booking) => {
    const dayStart = new Date(dayKey);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const clampStart = Math.max(booking.etb.getTime(), dayStart.getTime());
    const clampEnd = Math.min(booking.etd.getTime(), dayEnd.getTime());
    const totalMs = dayEnd.getTime() - dayStart.getTime();
    const top = ((clampStart - dayStart.getTime()) / totalMs) * 100;
    const height = ((clampEnd - clampStart) / totalMs) * 100;

    return {
      top: `${top}%`,
      height: `${Math.max(height, 4)}%`,
    };
  };

  return (
    <div
      ref={setNodeRef}
      data-slot-id={id}
      className={cn(
        'relative min-h-[120px] border-b border-r border-slate-700/50 transition-colors',
        viewMode === 'day' && 'min-h-[60px]',
        isOver && isHoverValid && 'border-2 border-emerald-500/60 bg-emerald-500/10',
        isOver && isHoverInvalid && 'border-2 border-red-500/60 bg-red-500/10',
        !isOver && (isHoverValid || isHoverInvalid) && 'bg-transparent',
      )}
    >
      {bookingsForSlot.map((booking) => {
        const style = getPositionStyle(booking);
        return (
          <div
            key={booking.id}
            className="absolute left-1 right-1 z-10"
            style={style}
          >
            <BookingCard booking={booking} hasConflict={false} highlight={booking.id === highlightBookingId} />
          </div>
        );
      })}
    </div>
  );
}

// 日历网格主体
export default function CalendarGrid({ viewMode, currentDate, highlightBookingId, focusBerthId }: CalendarGridProps) {
  const { getFilteredBerths, bookings, moveBookingOnCalendar, detectConflict } = usePortStore();
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [hoverValid, setHoverValid] = useState(false);
  const [hoverInvalid, setHoverInvalid] = useState(false);
  const [, setRollbackKey] = useState(0);
  const [conflictAlert, setConflictAlert] = useState<ConflictInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dismissConflict = useCallback(() => setConflictAlert(null), []);

  useEffect(() => {
    if (!focusBerthId) return;
    const t = setTimeout(() => {
      const el = containerRef.current?.querySelector(`[data-berth-id="${focusBerthId}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-port-400/60', 'bg-port-900/30');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-port-400/60', 'bg-port-900/30');
        }, 3000);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [focusBerthId, viewMode, currentDate]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const days = useMemo(() => {
    if (viewMode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1, locale: zhCN }),
        end: endOfWeek(currentDate, { weekStartsOn: 1, locale: zhCN }),
      });
    }
    return [currentDate];
  }, [viewMode, currentDate]);

  const hours = useMemo(() => {
    if (viewMode !== 'day') return [];
    return Array.from({ length: 24 }, (_, i) => i);
  }, [viewMode]);

  const filteredBerths = useMemo(() => getFilteredBerths(), [getFilteredBerths]);

  const dayKeyMap = useMemo(() => {
    const map: Record<string, Date> = {};
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      map[key] = d;
    });
    return map;
  }, [days]);

  const bookingsBySlot = useMemo(() => {
    const result: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      if (!booking.berthId) return;
      const startDay = new Date(booking.etb);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(booking.etd);
      endDay.setHours(0, 0, 0, 0);

      let cur = new Date(startDay);
      while (cur <= endDay) {
        const key = format(cur, 'yyyy-MM-dd');
        if (dayKeyMap[key]) {
          const slotId = `slot-${booking.berthId}-${key}`;
          if (!result[slotId]) result[slotId] = [];
          result[slotId].push(booking);
        }
        cur = addDays(cur, 1);
      }
    });
    return result;
  }, [bookings, dayKeyMap]);

  const handleDragStart = (event: DragStartEvent) => {
    const booking = event.active.data.current?.booking as Booking | undefined;
    if (booking) setActiveBooking(booking);
  };

  const parseSlotId = (id: string) => {
    if (!id.startsWith('slot-')) return null;
    const parts = id.split('-');
    if (parts.length >= 5 && parts.length <= 6) {
      const berthId = parts[1];
      const dayStr = `${parts[2]}-${parts[3]}-${parts[4]}`;
      const hour = parts.length === 6 ? parseInt(parts[5], 10) : null;
      return { berthId, dayStr, hour };
    }
    return null;
  };

  const computeNewTimes = useCallback((dayStr: string, hour: number | null, booking: Booking) => {
    const dur = booking.etd.getTime() - booking.etb.getTime();
    if (hour !== null && hour !== undefined) {
      const newStart = setMinutes(setHours(new Date(dayStr), hour), 0);
      const newEnd = new Date(newStart.getTime() + dur);
      return { newStart, newEnd };
    }
    const startH = booking.etb.getHours();
    const startM = booking.etb.getMinutes();
    const newStart = setMinutes(setHours(new Date(dayStr), startH), startM);
    const newEnd = new Date(newStart.getTime() + dur);
    return { newStart, newEnd };
  }, []);

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over || !activeBooking) {
      setHoverValid(false);
      setHoverInvalid(false);
      return;
    }
    const overId = String(event.over.id);
    const parsed = parseSlotId(overId);
    if (!parsed) {
      setHoverValid(false);
      setHoverInvalid(false);
      return;
    }
    const { berthId, dayStr, hour } = parsed;
    const { newStart, newEnd } = computeNewTimes(dayStr, hour, activeBooking);
    const conflict = detectConflict(newStart, newEnd, berthId, activeBooking.id);
    setHoverValid(!conflict.hasConflict);
    setHoverInvalid(conflict.hasConflict);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    const booking = active.data.current?.booking as Booking | undefined;
    setActiveBooking(null);
    setHoverValid(false);
    setHoverInvalid(false);

    if (!over || !booking) return;
    const overId = over.id as string;
    const parsed = parseSlotId(overId);
    if (!parsed) return;
    const { berthId, dayStr, hour } = parsed;
    const { newStart, newEnd } = computeNewTimes(dayStr, hour, booking);

    const result = moveBookingOnCalendar(booking.id, berthId, newStart, newEnd);
    if (!result.success) {
      setRollbackKey((k) => k + 1);
      setConflictAlert(result.conflict || { hasConflict: true });
      setTimeout(() => setConflictAlert(null), 5000);
    }
  };

  const renderWeekView = () => (
    <div ref={containerRef} className="overflow-auto rounded-xl border border-slate-700/60 bg-slatex-800/40">
      <div className="grid" style={{ gridTemplateColumns: `160px repeat(${days.length}, minmax(180px, 1fr))` }}>
        <div className="sticky left-0 z-20 border-b border-r border-slate-700/60 bg-slatex-850 p-3 text-xs font-medium text-slate-400">
          泊位 / 日期
        </div>
        {days.map((day) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={cn(
                'border-b border-r border-slate-700/60 p-3 text-center',
                isToday ? 'bg-port-900/40' : 'bg-slatex-850',
              )}
            >
              <div className={cn('text-xs text-slate-400', isToday && 'text-port-300')}>
                {format(day, 'EEE', { locale: zhCN })}
              </div>
              <div className={cn('text-sm font-bold text-slate-100', isToday && 'text-port-300')}>
                {format(day, 'M月d日')}
              </div>
            </div>
          );
        })}

        {filteredBerths.map((berth) => (
          <>
            <div
              key={`berth-${berth.id}`}
              data-berth-id={berth.id}
              className="sticky left-0 z-10 flex flex-col justify-center border-b border-r border-slate-700/60 bg-slatex-800/80 p-3 transition-all duration-500"
            >
              <div className="text-sm font-bold text-slate-100">{berth.name}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {berth.depth}m
                </span>
                {berth.status === 'maintenance' && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                    维护
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {berth.capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded bg-port-900/50 px-1 py-0.5 text-[9px] text-port-300"
                    title={CARGO_LABELS[c]}
                  >
                    {CARGO_LABELS[c]}
                  </span>
                ))}
              </div>
            </div>
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const slotId = `slot-${berth.id}-${key}`;
              return (
                <DroppableCell
                  key={slotId}
                  id={slotId}
                  berth={berth}
                  dayKey={key}
                  bookingsForSlot={bookingsBySlot[slotId] || []}
                  viewMode={viewMode}
                  isHoverValid={hoverValid && activeBooking?.berthId !== berth.id}
                  isHoverInvalid={hoverInvalid && activeBooking?.berthId !== berth.id}
                  highlightBookingId={highlightBookingId}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );

  const renderDayView = () => {
    const totalCols = hours.length + 1;
    const dayKey = format(days[0], 'yyyy-MM-dd');
    const dayStart = new Date(days[0]);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return (
      <div ref={containerRef} className="overflow-auto rounded-xl border border-slate-700/60 bg-slatex-800/40">
        <div className="grid" style={{ gridTemplateColumns: `160px repeat(${hours.length}, minmax(60px, 1fr))` }}>
          <div className="sticky left-0 z-20 border-b border-r border-slate-700/60 bg-slatex-850 p-3 text-xs font-medium text-slate-400">
            泊位 / 小时
          </div>
          {hours.map((h) => (
            <div
              key={h}
              className="border-b border-r border-slate-700/60 bg-slatex-850 p-2 text-center text-xs text-slate-400"
            >
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}

          {filteredBerths.map((berth) => {
            const fullSlotId = `slot-${berth.id}-${dayKey}`;
            return (
              <>
                <div
                  key={`berth-d-${berth.id}`}
                  data-berth-id={berth.id}
                  className="sticky left-0 z-10 flex flex-col justify-center border-b border-r border-slate-700/60 bg-slatex-800/80 p-3 transition-all duration-500"
                >
                  <div className="text-sm font-bold text-slate-100">{berth.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{berth.depth}m</div>
                </div>
                {hours.map((h) => {
                  const slotId = `slot-${berth.id}-${dayKey}-${h}`;
                  const hourStartTs = dayStart.getTime() + h * 3600 * 1000;
                  const hourEndTs = hourStartTs + 3600 * 1000;

                  const bookingsInHour = (bookingsBySlot[fullSlotId] || []).filter((b) => {
                    const clampStart = Math.max(b.etb.getTime(), dayStart.getTime());
                    const clampEnd = Math.min(b.etd.getTime(), dayEnd.getTime());
                    if (clampStart >= clampEnd) return false;
                    return clampStart < hourEndTs && clampEnd > hourStartTs;
                  });

                  return (
                    <DayHourCell
                      key={slotId}
                      slotId={slotId}
                      berth={berth}
                      dayKey={dayKey}
                      dayStart={dayStart}
                      dayEnd={dayEnd}
                      hour={h}
                      bookingsInHour={bookingsInHour}
                      isHoverValid={hoverValid}
                      isHoverInvalid={hoverInvalid}
                      activeBookingId={activeBooking?.berthId}
                      highlightBookingId={highlightBookingId}
                    />
                  );
                })}
              </>
            );
          })}
        </div>
        <div style={{ display: 'none' }}>{totalCols}</div>
      </div>
    );
  };

  return (
    <div className="relative">
      {conflictAlert && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-500/15 to-red-500/5 px-5 py-3 shadow-lg animate-breath-glow">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="absolute inset-0 rounded-full bg-red-500/40 animate-pulse-ring" />
            </div>
            <div>
              <div className="text-sm font-semibold text-red-300">时间冲突，已保持原安排</div>
              <div className="text-xs text-red-400/80">
                {conflictAlert.conflictShipName
                  ? `与「${conflictAlert.conflictShipName}」的靠泊时间重叠`
                  : '该时段已被占用，请调整时间或更换泊位'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissConflict}
            className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {viewMode === 'week' ? renderWeekView() : renderDayView()}
        <DragOverlay dropAnimation={null}>
          {activeBooking && (
            <div className="opacity-80 shadow-2xl" style={{ width: '200px', height: '80px' }}>
              <BookingCard booking={activeBooking} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
