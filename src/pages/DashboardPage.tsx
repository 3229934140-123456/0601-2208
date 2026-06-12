import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, ChevronRight, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import StatsCards from '@/components/dashboard/StatsCards';
import WaitingQueue from '@/components/dashboard/WaitingQueue';
import BerthStatusList from '@/components/dashboard/BerthStatusList';
import TimeoutAlerts from '@/components/dashboard/TimeoutAlerts';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePortStore } from '@/store/usePortStore';

export default function DashboardPage() {
  const [now, setNow] = useState(new Date());
  const waitingShips = usePortStore((s) => s.waitingShips);
  const reorderWaitingShips = usePortStore((s) => s.reorderWaitingShips);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = waitingShips.findIndex((w) => w.id === active.id);
    const newIndex = waitingShips.findIndex((w) => w.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderWaitingShips(oldIndex, newIndex);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="inline-flex items-center gap-1 hover:text-port-600 transition-colors">
                <Home className="h-3.5 w-3.5" />
                首页
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="font-medium text-slate-800">排队看板</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
              <span className="text-xs text-slate-400">当前时间</span>
              <span className="text-sm font-semibold text-slate-800 font-mono tabular-nums">
                {format(now, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
              </span>
            </div>
          </div>

          <StatsCards />

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SortableContext items={waitingShips.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
                  <WaitingQueue />
                </div>
              </SortableContext>
            </div>
            <div className="lg:col-span-5">
              <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
                <BerthStatusList />
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
                <TimeoutAlerts />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
