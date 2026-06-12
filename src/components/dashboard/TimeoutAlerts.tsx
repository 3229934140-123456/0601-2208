import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap, Navigation } from 'lucide-react';
import { usePortStore } from '@/store/usePortStore';
import { cn } from '@/lib/utils';

interface AlertItemProps {
  type: 'eta_passed' | 'overtime';
  shipName: string;
  hours: number;
  bookingId?: string;
  blink: boolean;
}

function AlertItem({ type, shipName, hours, bookingId, blink }: AlertItemProps) {
  const navigate = useNavigate();
  const isEta = type === 'eta_passed';

  const handleAction = () => {
    if (bookingId) {
      navigate(`/plans?booking=${bookingId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-rose-50 to-red-50 p-4 animate-breath-glow',
        blink ? 'border-rose-400' : 'border-rose-300',
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-rose-400/10 via-transparent to-rose-400/10" />
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            isEta ? 'bg-rose-500' : 'bg-red-600',
          )}
        >
          <AlertTriangle className={cn('h-4.5 w-4.5 text-white', blink ? 'animate-pulse' : '')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-rose-900 truncate">{shipName}</h4>
            <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500 fill-amber-500" />
          </div>
          <p className="mt-0.5 text-xs text-rose-700">
            {isEta ? 'ETA已过尚未靠泊' : '作业超过预计时间'}
          </p>
          <p className="mt-1.5 text-lg font-bold text-rose-700">
            已超 {hours} 小时
          </p>
          <button
            type="button"
            onClick={handleAction}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
          >
            <Navigation className="h-3.5 w-3.5" />
            紧急处理
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TimeoutAlerts() {
  const getTimeoutAlerts = usePortStore((s) => s.getTimeoutAlerts);
  const [blink, setBlink] = useState(false);

  const alerts = useMemo(() => getTimeoutAlerts(), [getTimeoutAlerts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBlink((v) => !v);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full flex-col rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          超时提醒
          {alerts.length > 0 && (
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
          )}
        </h3>
        <span className="text-xs text-slate-400">共 {alerts.length} 条</span>
      </div>
      <div className="flex-1 space-y-3 p-4 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <AlertTriangle className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-400">暂无超时预警</p>
          </div>
        ) : (
          alerts.map((a) => (
            <AlertItem
              key={a.id}
              type={a.type}
              shipName={a.shipName}
              hours={a.hours}
              bookingId={a.bookingId}
              blink={blink}
            />
          ))
        )}
      </div>
    </div>
  );
}
