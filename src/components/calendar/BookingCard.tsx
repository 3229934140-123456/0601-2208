import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Package, Waves, Droplets, Cylinder, Boxes } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Booking, CargoType } from '@/types';
import { CARGO_LABELS } from '@/types';
import { usePortStore } from '@/store/usePortStore';

interface BookingCardProps {
  booking: Booking;
  hasConflict?: boolean;
}

const cargoIcons: Record<CargoType, React.ComponentType<{ className?: string }>> = {
  container: Package,
  bulk: Boxes,
  liquid: Droplets,
  gas: Cylinder,
  general: Waves,
};

const statusBg: Record<string, string> = {
  pending: 'bg-gradient-to-br from-amber-500/40 to-orange-500/30 border-amber-400/40',
  confirmed: 'bg-gradient-to-br from-sky-500/40 to-blue-500/30 border-sky-400/40',
  berthed: 'bg-gradient-to-br from-emerald-500/40 to-teal-500/30 border-emerald-400/40',
  departed: 'bg-gradient-to-br from-slate-500/40 to-slate-600/30 border-slate-400/40',
  cancelled: 'bg-gradient-to-br from-rose-500/40 to-red-600/30 border-rose-400/40',
};

// 日历卡片（可拖拽）
export default function BookingCard({ booking, hasConflict = false }: BookingCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { detectConflict } = usePortStore();
  const CargoIcon = cargoIcons[booking.cargoType];

  const conflictInfo = hasConflict && booking.berthId
    ? detectConflict(booking.etb, booking.etd, booking.berthId, booking.id)
    : null;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `booking-${booking.id}`,
    data: { bookingId: booking.id, booking },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-booking-id={booking.id}
      className={cn(
        'group relative flex h-full w-full cursor-grab flex-col justify-between overflow-hidden rounded-lg border p-2 text-white shadow-md backdrop-blur-sm transition-all hover:shadow-lg active:cursor-grabbing',
        statusBg[booking.status] || statusBg.pending,
        isDragging && 'opacity-50 scale-[1.02] shadow-xl',
        hasConflict && 'border-2 border-red-500 animate-shake',
      )}
    >
      {hasConflict && (
        <div
          className="absolute right-1 top-1 z-10"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <AlertCircle className="h-4 w-4 text-red-400 drop-shadow" />
          {showTooltip && conflictInfo?.hasConflict && (
            <div className="absolute right-6 top-0 z-50 w-48 rounded-md border border-red-400/50 bg-slatex-900 p-2 text-xs shadow-xl animate-fade-in-down">
              <div className="font-semibold text-red-400">时间冲突</div>
              <div className="mt-1 text-slate-300">
                与 <span className="font-medium text-red-300">{conflictInfo.conflictShipName}</span> 重叠
              </div>
              <div className="mt-0.5 text-slate-400">
                {format(conflictInfo.overlapStart!, 'MM-dd HH:mm')} ~{' '}
                {format(conflictInfo.overlapEnd!, 'MM-dd HH:mm')}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="truncate text-[11px] font-bold leading-tight">{booking.shipName}</span>
      </div>

      <div className="flex items-center justify-between gap-1">
        <div
          className="flex items-center gap-0.5 rounded bg-black/20 px-1 py-0.5"
          title={CARGO_LABELS[booking.cargoType]}
        >
          <CargoIcon className="h-3 w-3" />
        </div>
        <div className="truncate text-[10px] opacity-90">
          {format(booking.etb, 'HH:mm')}-{format(booking.etd, 'HH:mm')}
        </div>
      </div>
    </div>
  );
}
