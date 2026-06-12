import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Package, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { usePortStore } from '@/store/usePortStore';
import { cn } from '@/lib/utils';
import type { WaitingShip as WaitingShipType } from '@/types';

const PRIORITY_CONFIG = {
  high: { label: '高', className: 'bg-rose-100 text-rose-700 ring-rose-200' },
  normal: { label: '中', className: 'bg-amber-100 text-amber-700 ring-amber-200' },
  low: { label: '低', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
} as const;

interface WaitingShipCardProps {
  waiting: WaitingShipType;
  shipName: string;
  cargoAmount: number;
  eta: Date;
}

function WaitingShipCard({ waiting, shipName, cargoAmount, eta }: WaitingShipCardProps) {
  const navigate = useNavigate();
  const priorityCfg = PRIORITY_CONFIG[waiting.priority];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: waiting.id,
    data: { type: 'waiting', bookingId: waiting.bookingId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-port-200 hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
            priorityCfg.className,
          )}
        >
          {priorityCfg.label}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-slate-900 truncate">{shipName}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {cargoAmount.toLocaleString()} 吨
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(eta, 'MM-dd HH:mm', { locale: zhCN })}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/calendar');
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-port-50 px-3 py-1.5 text-xs font-medium text-port-700 transition-colors hover:bg-port-100"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            分配泊位
          </button>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-sm font-bold text-orange-600 ring-1 ring-inset ring-orange-100">
            <Timer className="h-4 w-4" />
            {waiting.expectedWaitHours}h
          </span>
          <p className="mt-1 text-[10px] text-slate-400">预计等待</p>
        </div>
      </div>
    </div>
  );
}

export default function WaitingQueue() {
  const waitingShips = usePortStore((s) => s.waitingShips);
  const bookings = usePortStore((s) => s.bookings);

  const items = useMemo(() => {
    return waitingShips
      .map((w) => {
        const b = bookings.find((x) => x.id === w.bookingId);
        return { waiting: w, booking: b };
      })
      .filter((x) => x.booking) as Array<{ waiting: WaitingShipType; booking: NonNullable<ReturnType<typeof bookings.find>> }>;
  }, [waitingShips, bookings]);

  return (
    <div className="flex h-full flex-col rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          等待队列
          <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 min-w-[1.5rem]">
            {items.length}
          </span>
        </h3>
      </div>
      <div className="flex-1 space-y-3 p-4 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center py-12 text-sm text-slate-400">暂无等待船舶</div>
        ) : (
          items.map(({ waiting, booking }) => (
            <WaitingShipCard
              key={waiting.id}
              waiting={waiting}
              shipName={booking.shipName}
              cargoAmount={booking.cargoAmount}
              eta={booking.eta}
            />
          ))
        )}
      </div>
    </div>
  );
}
