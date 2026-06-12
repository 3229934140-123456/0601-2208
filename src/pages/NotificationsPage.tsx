import { useState, useMemo } from 'react';
import CategoryNav from '@/components/notifications/CategoryNav';
import MessageList from '@/components/notifications/MessageList';
import MessageDetail from '@/components/notifications/MessageDetail';
import SendMessageModal from '@/components/notifications/SendMessageModal';
import { usePortStore } from '@/store/usePortStore';
import type { Notification, NotificationCategory } from '@/types';
import { Search } from 'lucide-react';

// 通知中心页
export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [selectedMessage, setSelectedMessage] = useState<Notification | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { markNotificationRead, filterNotifications, bookings } = usePortStore();

  const filteredMessages = useMemo(() => {
    const list = filterNotifications(activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((n) => {
      const ship = (n.relatedShipName || '').toLowerCase();
      const receiver = (n.receiverName || '').toLowerCase();
      const sender = (n.senderName || '').toLowerCase();
      const title = (n.title || '').toLowerCase();
      const content = (n.content || '').toLowerCase();
      return (
        ship.includes(q) ||
        receiver.includes(q) ||
        sender.includes(q) ||
        title.includes(q) ||
        content.includes(q)
      );
    });
  }, [activeCategory, searchQuery, filterNotifications]);

  const handleSelect = (msg: Notification) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      markNotificationRead(msg.id);
    }
  };

  const firstUnread = filteredMessages.find((n) => !n.isRead);
  const initialSelected = selectedMessage || firstUnread || null;

  const relatedBooking = initialSelected?.bookingId
    ? bookings.find((b) => b.id === initialSelected.bookingId) || null
    : null;

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">通知中心</h1>
          <p className="mt-1 text-sm text-slate-400">与船代协同沟通，发送靠泊确认、改期通知、作业提醒等</p>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-12 gap-4">
        <div className="col-span-2 rounded-xl border border-slate-700/60 bg-slatex-800/40 p-3">
          <CategoryNav
            activeCategory={activeCategory}
            onCategoryChange={(cat) => {
              setActiveCategory(cat);
              setSelectedMessage(null);
            }}
            onSendClick={() => setShowSendModal(true)}
          />
        </div>

        <div className="col-span-5 min-h-0 overflow-hidden rounded-xl border border-slate-700/60 bg-slatex-800/40">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-200">消息列表</h3>
            <div className="relative w-48">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索船名/船代..."
                className="h-8 w-full rounded-md border border-slate-600 bg-slatex-850 pl-7 pr-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:border-port-500 focus:ring-1 focus:ring-port-500/40"
              />
            </div>
            <span className="text-xs text-slate-500">
              共 {filteredMessages.length} 条
            </span>
          </div>
          <div className="h-[calc(100%-57px)]">
            <MessageList
              messages={filteredMessages}
              selectedId={selectedMessage?.id || null}
              onSelect={handleSelect}
            />
          </div>
        </div>

        <div className="col-span-5 min-h-0">
          <MessageDetail message={initialSelected} relatedBooking={relatedBooking} />
        </div>
      </div>

      <SendMessageModal open={showSendModal} onClose={() => setShowSendModal(false)} />
    </div>
  );
}
