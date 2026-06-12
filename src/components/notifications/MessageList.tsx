import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface MessageListProps {
  messages: Notification[];
  selectedId: string | null;
  onSelect: (msg: Notification) => void;
}

const avatarColors = [
  'bg-gradient-to-br from-port-500 to-blue-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
];

// 消息列表
export default function MessageList({ messages, selectedId, onSelect }: MessageListProps) {

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const getInitial = (name: string) => {
    const trimmed = name.trim();
    return trimmed.charAt(trimmed.length - 1) || trimmed.charAt(0) || '?';
  };

  const truncateContent = (text: string, max = 16) => {
    const stripped = text.replace(/[\n\r]/g, ' ').trim();
    if (stripped.length <= max) return stripped;
    return stripped.slice(0, max) + '…';
  };

  const formatTime = (d: Date) => {
    const diff = Date.now() - d.getTime();
    if (diff < 24 * 3600 * 1000) {
      return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
    }
    return format(d, 'MM-dd HH:mm', { locale: zhCN });
  };

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-5xl opacity-20">📭</div>
          <p className="mt-3 text-sm text-slate-500">暂无消息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto divide-y divide-slate-700/50">
      {messages.map((msg) => {
        const isSelected = msg.id === selectedId;
        return (
          <button
            key={msg.id}
            type="button"
            onClick={() => onSelect(msg)}
            className={cn(
              'group w-full px-4 py-3 text-left transition-all',
              isSelected
                ? 'bg-port-600/15 border-l-2 border-port-500'
                : 'hover:bg-slatex-800/70 border-l-2 border-transparent',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md',
                    getAvatarColor(msg.senderName),
                  )}
                >
                  {getInitial(msg.senderName)}
                </div>
                {!msg.isRead && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slatex-850 bg-rose-500 shadow" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm',
                      !msg.isRead ? 'font-semibold text-slate-100' : 'font-medium text-slate-300',
                    )}
                  >
                    {msg.title}
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-slate-500">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>

                <p className={cn('mt-0.5 text-xs text-slate-400')}>
                  <span className="text-slate-500">{msg.senderName}：</span>
                  {truncateContent(msg.content)}
                </p>

                {msg.relatedShipName && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-md bg-slate-700/50 px-2 py-0.5 text-[10px] text-port-300">
                      🚢 {msg.relatedShipName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
