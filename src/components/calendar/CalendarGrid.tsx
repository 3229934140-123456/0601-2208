import { useMemo, useState } from 'react';
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
import { eachDayOfInterval, format, startOfWeek, endOfWeek, addDays, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePortStore } from '@/store/usePortStore';
import BookingCard from './BookingCard';
import type { Booking, ViewMode, Berth } from '@/types';
import { CARGO_LABELS } from '@/types';

interface CalendarGridProps {
  viewMode: ViewMode;
  currentDate: Date;
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
}: {
  id: string;
  berth: Berth;
  dayKey: string;
  bookingsForSlot: Booking[];
  viewMode: ViewMode;
  isHoverValid: boolean;
  isHoverInvalid: boolean;
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
            <BookingCard booking={booking} hasConflict={false} />
          </div>
        );
      })}
    </div>
  );
}

// 日历网格主体
export default function CalendarGrid({ viewMode, currentDate }: CalendarGridProps) {
  const { getFilteredBerths, bookings, moveBookingOnCalendar, detectConflict } = usePortStore();
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [hoverValid, setHoverValid] = useState(false);
  const [hoverInvalid, setHoverInvalid] = useState(false);
  const [, setRollbackKey] = useState(0);

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

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over || !activeBooking) {
      setHoverValid(false);
      setHoverInvalid(false);
      return;
    }
    const overId = String(event.over.id);
    if (!overId.startsWith('slot-')) {
      setHoverValid(false);
      setHoverInvalid(false);
      return;
    }
    const parts = overId.split('-');
    const berthId = parts[1];
    const dayStr = `${parts[2]}-${parts[3]}-${parts[4]}`;

    const duration = activeBooking.etd.getTime() - activeBooking.etb.getTime();
    const newStart = setMinutes(setHours(new Date(dayStr), 8), 0);
    const newEnd = new Date(newStart.getTime() + duration);

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
    if (!overId.startsWith('slot-')) return;

    const parts = overId.split('-');
    const berthId = parts[1];
    const dayStr = `${parts[2]}-${parts[3]}-${parts[4]}`;

    const duration = booking.etd.getTime() - booking.etb.getTime();
    const newStart = setMinutes(setHours(new Date(dayStr), 8), 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const result = moveBookingOnCalendar(booking.id, berthId, newStart, newEnd);
    if (!result.success) {
      setRollbackKey((k) => k + 1);
    }
  };

  const renderWeekView = () => (
    <div className="overflow-auto rounded-xl border border-slate-700/60 bg-slatex-800/40">
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
              className="sticky left-0 z-10 flex flex-col justify-center border-b border-r border-slate-700/60 bg-slatex-800/80 p-3"
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
    return (
      <div className="overflow-auto rounded-xl border border-slate-700/60 bg-slatex-800/40">
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

          {filteredBerths.map((berth) => (
            <>
              <div
                key={`berth-d-${berth.id}`}
                className="sticky left-0 z-10 flex flex-col justify-center border-b border-r border-slate-700/60 bg-slatex-800/80 p-3"
              >
                <div className="text-sm font-bold text-slate-100">{berth.name}</div>
                <div className="mt-1 text-xs text-slate-400">{berth.depth}m</div>
              </div>
              {hours.map((h) => {
                const key = format(days[0], 'yyyy-MM-dd');
                const slotId = `slot-${berth.id}-${key}-${h}`;
                const fullSlotId = `slot-${berth.id}-${key}`;
                const dayHoursBookings = (bookingsBySlot[fullSlotId] || []).filter((b) => {
                  const startH = b.etb.getHours();
                  const endH = b.etd.getHours() + (b.etd.getMinutes() > 0 ? 1 : 0);
                  return h >= startH && h < endH;
                });
                const useCell = dayHoursBookings.length > 0 && dayHoursBookings[0].etb.getHours() === h;
                return (
                  <div
                    key={slotId}
                    className="relative h-[60px] border-b border-r border-slate-700/50"
                  >
                    {useCell && (() => {
                      const booking = dayHoursBookings[0];
                      const startH = booking.etb.getHours() + booking.etb.getMinutes() / 60;
                      const endH = booking.etd.getHours() + booking.etd.getMinutes() / 60;
                      const left = ((startH - h) / 1) * 100;
                      const width = ((endH - startH) / 1) * 100;
                      const colSpan = Math.ceil(endH - startH);
                      return (
                        <div
                          className="absolute top-1 bottom-1 z-10"
                          style={{
                            left: `${Math.max(0, left)}%`,
                            width: `calc(${Math.min(width, colSpan * 100)}% + ${Math.max(0, colSpan - 1)} * 0px)`,
                            minWidth: '60px',
                          }}
                        >
                          <BookingCard booking={booking} />
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        <div style={{ display: 'none' }}>{totalCols}</div>
      </div>
    );
  };

  return (
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
  );
}
