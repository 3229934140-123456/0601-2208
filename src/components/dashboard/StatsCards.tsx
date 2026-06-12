import { Ship, Clock, Anchor, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePortStore } from '@/store/usePortStore';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  delta: number;
  deltaLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  barGradient: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, delta, deltaLabel, icon: Icon, barGradient, iconBg, iconColor }: StatCardProps) {
  const deltaPositive = delta > 0;
  const deltaZero = delta === 0;
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
      <div className={cn('absolute inset-y-0 left-0 w-1.5 rounded-l-xl', barGradient)} />
      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
            <span
              className={cn(
                'mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                deltaZero
                  ? 'bg-slate-100 text-slate-500'
                  : deltaPositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600',
              )}
            >
              {deltaZero ? (
                <Minus className="h-3 w-3" />
              ) : deltaPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {deltaZero ? '持平' : `${Math.abs(delta)}`}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">{deltaLabel}</p>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-5.5 w-5.5', iconColor)} />
        </div>
      </div>
    </div>
  );
}

export default function StatsCards() {
  const todayBerthed = usePortStore((s) => s.todayBerthedCount);
  const yesterdayBerthed = usePortStore((s) => s.yesterdayBerthedCount);
  const waitingCount = usePortStore((s) => s.waitingShips.length);
  const waitingDelta = usePortStore((s) => s.waitingCountDelta);
  const berths = usePortStore((s) => s.berths);
  const idleBerthsDelta = usePortStore((s) => s.idleBerthsDelta);
  const alertCount = usePortStore((s) => s.alertCount);
  const yesterdayAlertCount = usePortStore((s) => s.yesterdayAlertCount);

  const idleCount = berths.filter((b) => b.status === 'available').length;
  const berthedDelta = todayBerthed - yesterdayBerthed;
  const alertDelta = alertCount - yesterdayAlertCount;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="今日靠泊"
        value={todayBerthed}
        delta={berthedDelta}
        deltaLabel={`较昨日${berthedDelta >= 0 ? '多' : '少'}${Math.abs(berthedDelta)}艘次`}
        icon={Ship}
        barGradient="bg-gradient-to-b from-sky-400 to-sky-600"
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
      />
      <StatCard
        title="等待中"
        value={waitingCount}
        delta={waitingDelta}
        deltaLabel={`较昨日${waitingDelta >= 0 ? '增加' : '减少'}${Math.abs(waitingDelta)}艘`}
        icon={Clock}
        barGradient="bg-gradient-to-b from-amber-400 to-amber-600"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      />
      <StatCard
        title="空闲泊位"
        value={`${idleCount}/${berths.length}`}
        delta={idleBerthsDelta}
        deltaLabel={`较昨日${idleBerthsDelta >= 0 ? '增加' : '减少'}${Math.abs(idleBerthsDelta)}个`}
        icon={Anchor}
        barGradient="bg-gradient-to-b from-emerald-400 to-emerald-600"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
      <StatCard
        title="异常数"
        value={alertCount}
        delta={alertDelta}
        deltaLabel={`较昨日${alertDelta >= 0 ? '增加' : '减少'}${Math.abs(alertDelta)}条`}
        icon={AlertTriangle}
        barGradient="bg-gradient-to-b from-rose-400 to-rose-600"
        iconBg="bg-rose-50"
        iconColor="text-rose-600"
      />
    </div>
  );
}
