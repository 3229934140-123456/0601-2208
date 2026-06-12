import { useState, useMemo } from 'react';
import { X, Send, FileText, Calendar, RefreshCw, Bell, Ship } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePortStore } from '@/store/usePortStore';
import type { NotificationType, Booking, CargoType } from '@/types';
import { CARGO_LABELS } from '@/types';

interface SendMessageModalProps {
  open: boolean;
  onClose: () => void;
}

const typeOptions: { key: NotificationType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: 'confirm', label: '靠泊确认', icon: Calendar, color: 'text-emerald-400' },
  { key: 'reschedule', label: '改期通知', icon: RefreshCw, color: 'text-amber-400' },
  { key: 'alert', label: '普通提醒', icon: Bell, color: 'text-port-400' },
  { key: 'custom', label: '自定义', icon: FileText, color: 'text-slate-400' },
];

const templates: Record<string, { title: string; content: string }> = {
  confirm: {
    title: '靠泊确认通知',
    content:
      '尊敬的船代您好：\n\n贵司所属船舶 [船名] 已确认靠泊安排如下：\n\n泊位：[泊位名称]\n预计靠泊时间(ETB)：[日期时间]\n预计离港时间(ETD)：[日期时间]\n\n请提前做好进港准备，如有变动请及时联系调度中心。\n\n此致敬礼\n调度中心',
  },
  reschedule: {
    title: '靠泊时间调整通知',
    content:
      '尊敬的船代您好：\n\n因港口调度原因，贵司船舶 [船名] 的原靠泊计划调整如下：\n\n调整后泊位：[泊位名称]\n新靠泊时间(ETB)：[日期时间]\n新离港时间(ETD)：[日期时间]\n\n对于此次调整带来的不便，我们深表歉意。如有疑问请联系调度中心。\n\n此致敬礼\n调度中心',
  },
  alert: {
    title: '作业提醒',
    content:
      '尊敬的船代您好：\n\n贵司船舶 [船名] 请留意以下事项：\n\n• 请按确认时间准时进港靠泊\n• 提前联系引航站办理手续\n• 作业期间请保持通讯畅通\n\n如有特殊情况，请及时告知调度中心。\n\n此致敬礼\n调度中心',
  },
};

function bCargoLabel(t: CargoType) {
  return CARGO_LABELS[t] || t;
}

function fillPlaceholders(tpl: string, b: Booking | null, berthName: string) {
  let s = tpl;
  if (b) {
    s = s.replace(/\[船名\]/g, b.shipName);
    s = s.replace(/\[泊位名称\]/g, berthName);
    s = s.replace(/\[日期时间\]/g, (_m, i) => {
      const firstIdx = s.indexOf('[日期时间]');
      if (i === 0 || firstIdx === s.indexOf('[日期时间]', i - 10)) {
        return format(b.etb, 'yyyy-MM-dd HH:mm');
      }
      return format(b.etd, 'yyyy-MM-dd HH:mm');
    });
  }
  return s;
}

// 发送消息弹窗
export default function SendMessageModal({ open, onClose }: SendMessageModalProps) {
  const { sendNotification, bookings, berths } = usePortStore();
  const [receiverId, setReceiverId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [msgType, setMsgType] = useState<NotificationType>('confirm');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const agentOptions = useMemo(() => {
    const map = new Map<string, string>();
    bookings.forEach((b) => {
      if (b.agentId && b.agentName && !map.has(b.agentId)) {
        map.set(b.agentId, b.agentName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bookings]);

  const bookingOptions = useMemo(() => {
    return bookings
      .filter((b) => !receiverId || b.agentId === receiverId)
      .sort((a, b) => b.etb.getTime() - a.etb.getTime())
      .slice(0, 50);
  }, [bookings, receiverId]);

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) || null,
    [bookings, selectedBookingId],
  );

  const selectedBerthName = useMemo(() => {
    if (!selectedBooking?.berthId) return '未分配';
    return berths.find((b) => b.id === selectedBooking.berthId)?.name || '未分配';
  }, [selectedBooking, berths]);

  const handleClose = () => {
    setReceiverId('');
    setReceiverName('');
    setMsgType('confirm');
    setTitle('');
    setContent('');
    setSelectedBookingId('');
    setErrors({});
    onClose();
  };

  const applyTemplate = (key: string) => {
    const tpl = templates[key];
    if (tpl) {
      setTitle(fillPlaceholders(tpl.title, selectedBooking, selectedBerthName));
      setContent(fillPlaceholders(tpl.content, selectedBooking, selectedBerthName));
      if (key !== 'custom') {
        const t = typeOptions.find((o) => o.key === key);
        if (t) setMsgType(t.key as NotificationType);
      }
    }
  };

  const handleSelectAgent = (id: string, name: string) => {
    setReceiverId(id);
    setReceiverName(name);
    if (selectedBookingId) {
      const belong = bookings.find((b) => b.id === selectedBookingId);
      if (!belong || belong.agentId !== id) {
        setSelectedBookingId('');
      }
    }
    if (errors.receiverId) {
      setErrors((e) => {
        const n = { ...e };
        delete n.receiverId;
        return n;
      });
    }
  };

  const handleSelectBooking = (id: string) => {
    setSelectedBookingId(id);
  };

  const handleSend = () => {
    const e: Record<string, string> = {};
    if (!receiverId) e.receiverId = '请选择收件人';
    if (!title.trim()) e.title = '请输入标题';
    if (!content.trim()) e.content = '请输入内容';
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    sendNotification(
      msgType,
      title.trim(),
      content.trim(),
      receiverId,
      receiverName,
      selectedBookingId || undefined,
      selectedBooking?.shipName,
    );
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-down">
      <div className="flex h-[640px] w-[680px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slatex-850 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-port-600/20 text-port-400">
              <Send className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">发送消息</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slatex-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">快捷模板</label>
            <div className="flex flex-wrap gap-2">
              {typeOptions
                .filter((t) => t.key !== 'custom')
                .map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slatex-800 px-3 py-1.5 text-xs font-medium transition-all hover:border-slate-500 hover:bg-slatex-700"
                  >
                    <Icon className={cn('h-3.5 w-3.5', color)} />
                    {label}
                  </button>
                ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                收件人 (船代) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={receiverId}
                  onChange={(e) => {
                    const ag = agentOptions.find((a) => a.id === e.target.value);
                    handleSelectAgent(e.target.value, ag?.name || '');
                  }}
                  className={cn(
                    'h-10 w-full appearance-none rounded-lg border bg-slatex-850 px-3 pr-10 text-sm text-slate-100 outline-none transition-all',
                    errors.receiverId ? 'border-red-500/60 focus:border-red-500' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                  )}
                >
                  <option value="">请选择收件船代</option>
                  {agentOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {errors.receiverId && <p className="mt-1 text-xs text-red-400">{errors.receiverId}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">消息类型</label>
              <div className="grid grid-cols-4 gap-2">
                {typeOptions.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMsgType(key)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs transition-all',
                      msgType === key
                        ? 'border-port-500/60 bg-port-500/10 text-port-300'
                        : 'border-slate-600 bg-slatex-850 text-slate-400 hover:border-slate-500 hover:text-slate-200',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', msgType === key ? color : '')} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                <span className="mr-1 inline-flex items-center gap-1">
                  <Ship className="h-3 w-3 text-port-400" />
                  关联船舶计划
                </span>
                <span className="text-slate-500">（可选，关联后可按船名搜索并显示计划摘要）</span>
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => handleSelectBooking(e.target.value)}
                className={cn(
                  'h-10 w-full appearance-none rounded-lg border bg-slatex-850 px-3 pr-10 text-sm text-slate-100 outline-none transition-all border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                )}
              >
                <option value="">暂不关联船舶计划</option>
                {bookingOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shipName} · {b.agentName} · {format(b.etb, 'MM-dd HH:mm')}
                  </option>
                ))}
              </select>
              {selectedBooking && (
                <div className="mt-2 rounded-lg border border-slate-600/60 bg-slatex-800/50 px-3 py-2 text-[11px] text-slate-400">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>泊位：<span className="text-slate-200">{selectedBerthName}</span></span>
                    <span>货类：<span className="text-slate-200">{bCargoLabel(selectedBooking.cargoType)}</span></span>
                    <span>ETB：<span className="text-slate-200">{format(selectedBooking.etb, 'MM-dd HH:mm')}</span></span>
                    <span>ETD：<span className="text-slate-200">{format(selectedBooking.etd, 'MM-dd HH:mm')}</span></span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                消息标题 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="输入消息标题"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((er) => ({ ...er, title: '' }));
                }}
                className={cn(
                  'h-10 w-full rounded-lg border bg-slatex-850 px-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500',
                  errors.title ? 'border-red-500/60 focus:border-red-500' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                )}
              />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                消息内容 <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={10}
                placeholder="输入消息内容，支持多行文本..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) setErrors((er) => ({ ...er, content: '' }));
                }}
                className={cn(
                  'w-full resize-none rounded-lg border bg-slatex-850 px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none transition-all placeholder:text-slate-500',
                  errors.content ? 'border-red-500/60 focus:border-red-500' : 'border-slate-600 focus:border-port-500 focus:ring-1 focus:ring-port-500/40',
                )}
              />
              {errors.content && <p className="mt-1 text-xs text-red-400">{errors.content}</p>}
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>可使用占位符：[船名] [泊位名称] [日期时间]</span>
                <span>{content.length} 字</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-6 py-4 bg-slatex-850/80">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-slate-600 bg-slatex-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slatex-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-1.5 rounded-md bg-port-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-port-600/20 transition-all hover:bg-port-500 hover:shadow-port-500/30"
          >
            <Send className="h-4 w-4" />
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
