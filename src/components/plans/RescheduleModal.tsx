import { useEffect, useState } from 'react';
import { X, CalendarClock, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Booking } from '@/types';

export interface RescheduleModalProps {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (reason: string, newEtb?: Date, newEtd?: Date) => void;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export default function RescheduleModal({ open, booking, onClose, onConfirm }: RescheduleModalProps) {
  const [reason, setReason] = useState('');
  const [etbInput, setEtbInput] = useState('');
  const [etdInput, setEtdInput] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open && booking) {
      setReason('');
      setEtbInput(toLocalInputValue(booking.etb));
      setEtdInput(toLocalInputValue(booking.etd));
      setTouched(false);
    }
  }, [open, booking]);

  if (!open || !booking) return null;

  const reasonError = touched && reason.trim().length < 2;
  const canSubmit = reason.trim().length >= 2;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onConfirm(reason.trim(), fromLocalInputValue(etbInput), fromLocalInputValue(etdInput));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-down">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">改期申请</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {booking.shipName} · {booking.imoNumber ?? 'IMO编号'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">
            <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 ring-1 ring-inset ring-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold">原计划时间</p>
                  <p className="mt-0.5 font-mono tabular-nums">
                    ETB {format(booking.etb, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    <span className="mx-1 text-amber-400">~</span>
                    ETD {format(booking.etd, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                改期原因
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onBlur={() => setTouched(true)}
                rows={4}
                placeholder="请详细说明改期原因（天气、货物、船期调整等）..."
                className={cn(
                  'block w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2',
                  reasonError
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-port-300 focus:ring-port-100',
                )}
              />
              {reasonError && (
                <p className="mt-1 text-xs text-rose-600">请输入有效的改期原因</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  调整靠泊时间 (可选)
                </label>
                <input
                  type="datetime-local"
                  value={etbInput}
                  onChange={(e) => setEtbInput(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-port-300 focus:outline-none focus:ring-2 focus:ring-port-100"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  调整离港时间 (可选)
                </label>
                <input
                  type="datetime-local"
                  value={etdInput}
                  onChange={(e) => setEtdInput(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-port-300 focus:outline-none focus:ring-2 focus:ring-port-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors',
                canSubmit
                  ? 'bg-port-600 hover:bg-port-700'
                  : 'cursor-not-allowed bg-port-300',
              )}
            >
              确认改期
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
