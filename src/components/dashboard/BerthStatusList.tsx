import { useMemo } from 'react';
import { Gauge, Timer, Waves } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { usePortStore } from '@/store/usePortStore';
import { cn } from '@/lib/utils';
import type { Berth, Booking } from '@/types';

const STATUS_CONFIG = {
  available: { label: '空闲', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dot:bg-emerald-500' },
  occupied: { label: '作业中', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  maintenance: { label: '维护', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
} as const;

interface BerthRowProps {
  berth: Berth;
  currentShip?: Booking;
  now: Date;
}

function BerthRow({ berth, currentShip, now }: BerthRowProps) {
  const cfg = STATUS_CONFIG[berth.status];
  const isOccupied = berth.status === 'occupied';

  const departureCountdown = useMemo(() => {
    if (!currentShip) return null;
    return formatDistance(currentShip.etd, now, { addSuffix: true, locale: zhCN });
  }, [currentShip, now]);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        isOccupied
          ? 'border-sky-100 bg-sky-50/30 hover:border-sky-200'
          : berth.status === 'maintenance'
          ? 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
          : 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-slate-900">{berth.name}</h4>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
              <Waves className="h-3 w-3 text-blue-500" />
              水深 {berth.depth}m
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
              <Gauge className="h-3 w-3 text-indigo-500" />
              载重 {berth.capacity.toLocaleString()}T
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
              {berth.length}m
            </span>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
            cfg.className,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-emerald-500': berth.status === 'available',
            'bg-sky-500 animate-pulse': berth.status === 'occupied',
            'bg-slate-400': berth.status === 'maintenance',
          })} />
          {cfg.label}
        </span>
      </div>
      {isOccupied && currentShip && (
        <div className="mt-3 rounded-lg bg-white/80 p-3 ring-1 ring-inset ring-sky-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">当前作业</p>
              <p className="text-sm font-semibold text-slate-900">{currentShip.shipName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                <Timer className="h-3 w-3" />
                预计离港
              </p>
              <p className="text-sm font-bold text-sky-700">{departureCountdown}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BerthStatusList() {
  const berths = usePortStore((s) => s.berths);
  const bookings = usePortStore((s) => s.bookings);
  const now = useMemo(() => new Date(), []);

  const availableCount = berths.filter((b) => b.status === 'available').length;

  return (
    <div className="flex h-full flex-col rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900">泊位状态</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          空闲 {availableCount} / 共 {berths.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 p-4 overflow-y-auto">
        {berths.map((berth) => {
          const currentShip = bookings.find(
            (b) => b.berthId === berth.id && b.status === 'berthed',
          );
          return (
            <BerthRow key={berth.id} berth={berth} currentShip={currentShip} now={now} />
          );
        })}
      </div>
    </div>
  );
}
