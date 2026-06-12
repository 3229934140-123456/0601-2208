import { useState } from 'react';
import CategoryNav from '@/components/notifications/CategoryNav';
import MessageList from '@/components/notifications/MessageList';
import MessageDetail from '@/components/notifications/MessageDetail';
import SendMessageModal from '@/components/notifications/SendMessageModal';
import { usePortStore } from '@/store/usePortStore';
import type { Notification, NotificationCategory } from '@/types';

// 通知中心页
export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [selectedMessage, setSelectedMessage] = useState<Notification | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const { markNotificationRead, filterNotifications } = usePortStore();

  const handleSelect = (msg: Notification) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      markNotificationRead(msg.id);
    }
  };

  const firstUnread = filterNotifications(activeCategory).find((n) => !n.isRead);
  const initialSelected = selectedMessage || firstUnread || null;

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
          <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-200">消息列表</h3>
            <span className="text-xs text-slate-500">
              共 {filterNotifications(activeCategory).length} 条
            </span>
          </div>
          <div className="h-[calc(100%-53px)]">
            <MessageList
              category={activeCategory}
              selectedId={selectedMessage?.id || null}
              onSelect={handleSelect}
            />
          </div>
        </div>

        <div className="col-span-5 min-h-0">
          <MessageDetail message={initialSelected} />
        </div>
      </div>

      <SendMessageModal open={showSendModal} onClose={() => setShowSendModal(false)} />
    </div>
  );
}
