import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Anchor, Check, Calendar, LogOut, RefreshCcw, X, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePortStore } from '@/store/usePortStore';
import type { Booking, BookingStatus } from '@/types';

const CARGO_LABEL: Record<Booking['cargoType'], string> = {
  container: '集装箱',
  bulk: '散货',
  liquid: '液体',
  gas: '气体',
  general: '杂货',
};

const STATUS_STYLE: Record<BookingStatus, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  pending: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200', dot: 'bg-slate-400', label: '待确认' },
  confirmed: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', dot: 'bg-sky-500', label: '已确认' },
  berthed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500', label: '已靠泊' },
  departed: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200', dot: 'bg-violet-500', label: '已离港' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', dot: 'bg-rose-500', label: '已取消' },
};

export interface PlanTableProps {
  bookings: Booking[];
  onReschedule: (booking: Booking) => void;
}

interface MenuAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: BookingStatus;
  disabled?: boolean;
  className?: string;
}

const ACTIONS: MenuAction[] = [
  { key: 'confirm', label: '确认靠泊', icon: Check, status: 'confirmed' },
  { key: 'berth', label: '标记已靠泊', icon: Anchor, status: 'berthed' },
  { key: 'depart', label: '标记离港', icon: LogOut, status: 'departed' },
  { key: 'reschedule', label: '改期', icon: RefreshCcw },
  { key: 'cancel', label: '取消', icon: X, status: 'cancelled', className: 'text-rose-600 hover:bg-rose-50' },
  { key: 'notify', label: '发送通知', icon: Bell, className: 'text-sky-600 hover:bg-sky-50' },
];

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        s.bg, s.text, s.ring,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

function RowMenu({
  booking,
  onReschedule,
  onStatusChange,
  onNotify,
}: {
  booking: Booking;
  onReschedule: (booking: Booking) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onNotify: (booking: Booking) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleAction(action: MenuAction) {
    setOpen(false);
    if (action.key === 'reschedule') {
      onReschedule(booking);
    } else if (action.key === 'notify') {
      onNotify(booking);
    } else if (action.status) {
      onStatusChange(booking.id, action.status);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg animate-fade-in-down">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => handleAction(action)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50',
                  action.className,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlanTable({ bookings, onReschedule }: PlanTableProps) {
  const sendNotification = usePortStore((s) => s.sendNotification);
  const updateBookingStatus = (id: string, status: BookingStatus) => {
    usePortStore.getState().updateBookingStatus(id, status);
  };

  const handleNotify = (booking: Booking) => {
    sendNotification({
      type: 'custom',
      title: `${booking.shipName} 靠泊安排通知`,
      content: `您好，${booking.shipName} 的靠泊安排如下：\n预计到港：${booking.eta.toLocaleString()}\n预计靠泊：${booking.etb.toLocaleString()}\n预计离港：${booking.etd.toLocaleString()}\n${booking.berthId ? `靠泊泊位：${booking.berthId}` : '待分配泊位'} \n请做好相关准备工作。`,
      senderId: 'dispatcher001',
      senderName: '调度员张三',
      receiverId: booking.agentId,
      receiverName: booking.agentName,
      bookingId: booking.id,
      relatedShipName: booking.shipName,
    });
    alert(`已向 ${booking.agentName} 发送 ${booking.shipName} 的通知`);
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              {['船名', '泊位', '货类·货量', 'ETA ~ ETD', '状态', '船代', '操作'].map((th) => (
                <th
                  key={th}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400">
                  暂无预约计划
                </td>
              </tr>
            ) : (
              bookings.map((b, idx) => (
                <tr
                  key={b.id}
                  className={cn(
                    'transition-colors hover:bg-port-50/30',
                    idx % 2 === 1 ? 'bg-slate-50/40' : '',
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{b.shipName}</p>
                      <p className="text-xs text-slate-400">{b.imoNumber} · {b.nationality}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {b.berthId ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-100">
                        <Anchor className="h-3 w-3" />
                        {b.berthId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        未分配
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">{CARGO_LABEL[b.cargoType]}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="text-slate-600">{b.cargoAmount.toLocaleString()} t</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-xs text-slate-600 leading-relaxed">
                      <div className="font-mono tabular-nums">
                        <span className="text-slate-400">ETA </span>
                        {format(b.eta, 'MM-dd HH:mm', { locale: zhCN })}
                      </div>
                      <div className="font-mono tabular-nums">
                        <span className="text-slate-400">ETD </span>
                        {format(b.etd, 'MM-dd HH:mm', { locale: zhCN })}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-700">
                    {b.agentName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <div className="inline-flex items-center justify-end">
                      <RowMenu
                        booking={b}
                        onReschedule={onReschedule}
                        onStatusChange={updateBookingStatus}
                        onNotify={handleNotify}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
