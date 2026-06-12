import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Reply, CheckCheck, Clock, Navigation, Anchor, CalendarDays, Package } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePortStore } from '@/store/usePortStore';
import type { Booking, Notification } from '@/types';
import { CARGO_LABELS } from '@/types';

interface MessageDetailProps {
  message: Notification | null;
  relatedBooking?: Booking | null;
}

const quickReplies = [
  { key: 'received', label: '已收到', icon: CheckCheck, type: 'default' as const },
  { key: 'confirmed', label: '确认到港', icon: Navigation, type: 'success' as const },
  { key: 'adjust', label: '需要调整', icon: Clock, type: 'warning' as const },
];

// 消息详情面板
export default function MessageDetail({ message, relatedBooking }: MessageDetailProps) {
  const { sendNotification } = usePortStore();
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState('');
  const [sentFlash, setSentFlash] = useState(false);

  const gotoBookingCalendar = () => {
    if (!relatedBooking) return;
    const params = new URLSearchParams();
    params.set('date', relatedBooking.etb.toISOString().slice(0, 10));
    if (relatedBooking.berthId) params.set('berth', relatedBooking.berthId);
    params.set('highlight', relatedBooking.id);
    navigate(`/calendar?${params.toString()}`);
  };

  if (!message) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-700/60 bg-slatex-800/40">
        <div className="text-center">
          <div className="text-6xl opacity-20">💬</div>
          <p className="mt-4 text-sm text-slate-500">请从左侧选择一条消息查看详情</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!replyText.trim()) return;
    sendNotification(
      'custom',
      `回复：${message.title}`,
      replyText.trim(),
      message.senderId,
      message.senderName,
      message.bookingId,
      message.relatedShipName,
    );
    setReplyText('');
    setSentFlash(true);
    setTimeout(() => setSentFlash(false), 1500);
  };

  const handleQuickReply = (label: string) => {
    sendNotification(
      'custom',
      `回复：${message.title}`,
      label,
      message.senderId,
      message.senderName,
      message.bookingId,
      message.relatedShipName,
    );
    setSentFlash(true);
    setTimeout(() => setSentFlash(false), 1500);
  };

  const senderInitial = message.senderName.slice(-1) || message.senderName.charAt(0);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slatex-800/40">
      <div className="border-b border-slate-700/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-port-500 to-blue-600 text-base font-bold text-white shadow-md">
            {senderInitial}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-100">{message.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">来自 {message.senderName}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                {format(message.createdAt, 'yyyy年M月d日 HH:mm', { locale: zhCN })}
              </span>
              {message.relatedShipName && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="rounded-md bg-slate-700/60 px-2 py-0.5 text-port-300">
                    🚢 {message.relatedShipName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        <div className="rounded-lg bg-slatex-850/80 p-4 text-sm leading-relaxed text-slate-200 shadow-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {relatedBooking && (
          <div className="rounded-xl border border-port-500/30 bg-gradient-to-br from-port-500/10 to-transparent p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-port-300">
                <Anchor className="h-4 w-4" />
                关联船舶计划
              </h4>
              <button
                type="button"
                onClick={gotoBookingCalendar}
                className="flex items-center gap-1 rounded-md border border-port-500/40 bg-port-500/10 px-2.5 py-1 text-xs font-medium text-port-300 transition-colors hover:bg-port-500/20"
              >
                <CalendarDays className="h-3 w-3" />
                查看日历
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">船名</span>
                <p className="mt-0.5 font-semibold text-slate-100">{relatedBooking.shipName}</p>
              </div>
              <div>
                <span className="text-slate-500">泊位</span>
                <p className="mt-0.5 font-semibold text-slate-100">
                  {relatedBooking.berthId || '待分配'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">货类 · 货量</span>
                <p className="mt-0.5 font-medium text-slate-200">
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3 w-3 text-port-400" />
                    {CARGO_LABELS[relatedBooking.cargoType]} · {relatedBooking.cargoAmount.toLocaleString()} t
                  </span>
                </p>
              </div>
              <div>
                <span className="text-slate-500">船代</span>
                <p className="mt-0.5 font-medium text-slate-200">{relatedBooking.agentName}</p>
              </div>
              <div>
                <span className="text-slate-500">ETA 到港</span>
                <p className="mt-0.5 font-mono tabular-nums text-slate-200">
                  {format(relatedBooking.eta, 'MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
              <div>
                <span className="text-slate-500">ETB 靠泊</span>
                <p className="mt-0.5 font-mono tabular-nums text-slate-200">
                  {format(relatedBooking.etb, 'MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">ETD 离港</span>
                <p className="mt-0.5 font-mono tabular-nums text-slate-200">
                  {format(relatedBooking.etd, 'MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/60 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickReplies.map(({ key, label, icon: Icon, type }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleQuickReply(label)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                type === 'success' &&
                  'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
                type === 'warning' &&
                  'border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
                type === 'default' &&
                  'border border-slate-600 bg-slatex-850 text-slate-300 hover:bg-slate-700/70 hover:text-white',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              rows={2}
              placeholder="输入回复内容..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full resize-none rounded-lg border border-slate-600 bg-slatex-850 px-3 py-2 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-port-500 focus:ring-1 focus:ring-port-500/40"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!replyText.trim()}
            className={cn(
              'relative flex h-[42px] min-w-[42px] items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-all',
              replyText.trim()
                ? 'bg-port-600 text-white shadow-lg shadow-port-600/20 hover:bg-port-500'
                : 'cursor-not-allowed bg-slate-700 text-slate-500',
              sentFlash && 'animate-pulse-ring',
            )}
            title="发送回复 (Ctrl+Enter)"
          >
            <Reply className={cn('h-4 w-4', sentFlash && 'text-emerald-300')} />
            <Send className={cn('h-4 w-4 ml-0.5', sentFlash && 'text-emerald-300')} />
            {sentFlash && <span className="absolute inset-0 flex items-center justify-center">✓</span>}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500">
          提示：按 Ctrl/Cmd + Enter 可快速发送
        </p>
      </div>
    </div>
  );
}
