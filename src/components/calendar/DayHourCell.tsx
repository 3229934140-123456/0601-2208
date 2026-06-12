import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Booking, Berth } from '@/types';
import BookingCard from './BookingCard';

interface DayHourCellProps {
  slotId: string;
  berth: Berth;
  dayKey: string;
  dayStart: Date;
  dayEnd: Date;
  hour: number;
  bookingsInHour: Booking[];
  isHoverValid: boolean;
  isHoverInvalid: boolean;
  activeBookingId?: string | null;
  highlightBookingId?: string | null;
}

export default function DayHourCell({
  slotId,
  dayStart,
  dayEnd,
  hour,
  bookingsInHour,
  isHoverValid,
  isHoverInvalid,
  activeBookingId,
  highlightBookingId,
}: DayHourCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId });

  const hourStart = new Date(dayStart);
  hourStart.setHours(hour, 0, 0, 0);
  const hourEnd = new Date(dayStart);
  hourEnd.setHours(hour + 1, 0, 0, 0);

  const starterBookings = bookingsInHour.filter((b) => {
    const clampStart = Math.max(b.etb.getTime(), dayStart.getTime());
    return clampStart >= hourStart.getTime() && clampStart < hourEnd.getTime();
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative h-[60px] border-b border-r border-slate-700/50 transition-colors',
        isOver && isHoverValid && activeBookingId !== berthId(slotId) && 'border-2 border-emerald-500/60 bg-emerald-500/10',
        isOver && isHoverInvalid && activeBookingId !== berthId(slotId) && 'border-2 border-red-500/60 bg-red-500/10',
      )}
    >
      {starterBookings.map((booking) => {
        const clampStart = Math.max(booking.etb.getTime(), dayStart.getTime());
        const clampEnd = Math.min(booking.etd.getTime(), dayEnd.getTime());
        const startHFloat = (clampStart - dayStart.getTime()) / (1000 * 60 * 60);
        const endHFloat = (clampEnd - dayStart.getTime()) / (1000 * 60 * 60);
        const left = Math.max(0, (startHFloat - hour) * 100);
        const totalWidth = (endHFloat - startHFloat) * 100;
        const colSpan = Math.ceil(endHFloat - startHFloat);
        return (
          <div
            key={booking.id}
            className="absolute top-1 bottom-1 z-10"
            style={{
              left: `${left}%`,
              width: `calc(${Math.min(totalWidth, colSpan * 100)}% + ${Math.max(0, colSpan - 1)} * 0px)`,
              minWidth: '60px',
            }}
          >
            <BookingCard booking={booking} highlight={booking.id === highlightBookingId} />
          </div>
        );
      })}
    </div>
  );
}

function berthId(slotId: string): string | undefined {
  const parts = slotId.split('-');
  return parts[1];
}
