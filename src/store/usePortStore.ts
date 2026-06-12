import { create } from 'zustand';
import type {
  Berth,
  Booking,
  BookingFormData,
  BookingStatus,
  CalendarFilters,
  CargoType,
  ConflictInfo,
  Notification,
  NotificationCategory,
  NotificationType,
  TimeoutAlert,
  WaitingShip,
} from '@/types';
import { initPortData, generateId, loadWaitingOrder, saveWaitingOrder, reorderBySavedOrder } from '@/lib/utils';

type PartialNotification = Partial<Notification> &
  Pick<Notification, 'type' | 'title' | 'content'>;

interface PortState {
  berths: Berth[];
  bookings: Booking[];
  waitingShips: WaitingShip[];
  notifications: Notification[];
  filters: CalendarFilters;

  todayBerthedCount: number;
  yesterdayBerthedCount: number;
  waitingCountDelta: number;
  idleBerthsDelta: number;
  alertCount: number;
  yesterdayAlertCount: number;

  setFilters: (filters: Partial<CalendarFilters>) => void;
  resetFilters: () => void;

  addBooking: (data: BookingFormData) => Booking;
  createBooking: (data: BookingFormData, assignBerth?: boolean) => Booking | null;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  updateBookingStatus: (
    id: string,
    status: BookingStatus,
    rescheduleReason?: string,
    newEtb?: Date,
    newEtd?: Date
  ) => void;
  deleteBooking: (id: string) => void;
  getFilteredBookings: (
    search: string,
    status: BookingStatus | 'all',
    date: Date
  ) => Booking[];

  assignBerth: (
    bookingId: string,
    berthId: string,
    etb: Date,
    etd: Date
  ) => boolean;
  unassignBerth: (bookingId: string) => void;
  moveBookingOnCalendar: (
    bookingId: string,
    berthId: string,
    newEtb: Date,
    newEtd: Date
  ) => {
    success: boolean;
    conflict?: ConflictInfo;
  };

  detectConflict: (
    etb: Date,
    etd: Date,
    berthId: string,
    excludeId?: string
  ) => ConflictInfo;
  recommendBerths: (
    draft: number,
    dwt: number,
    length: number,
    cargoType: CargoType
  ) => Berth[];
  getBerthUtilization: (berthId: string) => number;
  getFilteredBerths: () => Berth[];

  getUnreadCount: (category: NotificationCategory) => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendNotification: {
    (partial: PartialNotification): void;
    (
      type: NotificationType,
      title: string,
      content: string,
      receiverId: string,
      receiverName: string,
      bookingId?: string,
      relatedShipName?: string
    ): void;
  };
  filterNotifications: (category: NotificationCategory) => Notification[];

  clearWaitingShip: (bookingId: string) => void;
  reorderWaitingShips: (oldIndex: number, newIndex: number) => void;

  getTodayBerthedCount: () => number;
  getWaitingCount: () => number;
  getAvailableBerthCount: () => number;
  getTimeoutCount: () => number;
  getTimeoutAlerts: () => TimeoutAlert[];
}

const defaultFilters: CalendarFilters = {
  draftMin: 0,
  draftMax: 20,
  capabilities: [],
};

const initialRaw = initPortData();
const savedOrder = typeof window !== 'undefined' ? loadWaitingOrder() : null;
const initial: typeof initialRaw = {
  ...initialRaw,
  waitingShips: reorderBySavedOrder(initialRaw.waitingShips, savedOrder),
};
const initialNotifications: Notification[] = [
  {
    id: generateId(),
    type: 'system',
    title: '系统提醒',
    content: '欢迎使用港航通泊位调度系统，请及时处理待分配船舶。',
    senderId: 'system',
    senderName: '系统',
    receiverId: 'dispatcher001',
    receiverName: '张三',
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: generateId(),
    type: 'confirm',
    title: '靠泊确认通知',
    content: '远洋明珠号已确认于今日14:00靠泊3号泊位，请做好相关准备工作。',
    senderId: 'sys',
    senderName: '调度中心',
    receiverId: 'A001',
    receiverName: '中国外轮代理',
    bookingId: 'BK001',
    relatedShipName: '远洋明珠号',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000),
  },
  {
    id: generateId(),
    type: 'alert',
    title: '等待超时提醒',
    content: '海龙号在锚地等待已超过预计时间，请调度员尽快安排靠泊。',
    senderId: 'sys',
    senderName: '调度中心',
    receiverId: 'A001',
    receiverName: '中国外轮代理',
    bookingId: 'BK003',
    relatedShipName: '海龙号',
    isRead: true,
    createdAt: new Date(Date.now() - 10 * 3600 * 1000),
  },
];

function isObjectPartialNotification(
  args: unknown[]
): args is [PartialNotification] {
  return (
    args.length === 1 &&
    typeof args[0] === 'object' &&
    args[0] !== null &&
    'type' in (args[0] as Record<string, unknown>) &&
    'title' in (args[0] as Record<string, unknown>) &&
    'content' in (args[0] as Record<string, unknown>)
  );
}

const computeDerived = (bookings: Booking[], berths: Berth[]) => {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayBeforeStart = new Date(yesterdayStart);
  dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);

  const isBerthedToday = (b: Booking) => {
    const etb = new Date(b.etb);
    return (
      b.status === 'berthed' ||
      ((b.status === 'confirmed' || b.status === 'pending') &&
        etb >= todayStart &&
        etb < tomorrowStart)
    );
  };
  const isBerthedYesterday = (b: Booking) => {
    const etb = new Date(b.etb);
    return (
      (b.status === 'berthed' ||
        b.status === 'confirmed' ||
        b.status === 'departed') &&
      etb >= yesterdayStart &&
      etb < todayStart
    );
  };

  const todayBerthedCount = bookings.filter(isBerthedToday).length;
  const yesterdayBerthedCount = bookings.filter(isBerthedYesterday).length;

  const today = now;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const countWaitingOnDate = (date: Date) => {
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return bookings.filter((b) => {
      if (b.berthId) return false;
      if (b.status === 'departed' || b.status === 'cancelled') return false;
      const eta = new Date(b.eta);
      return eta >= dayStart && eta < dayEnd;
    }).length;
  };

  const todayWaiting = countWaitingOnDate(today);
  const yesterdayWaiting = countWaitingOnDate(yesterday);
  const waitingCountDelta = todayWaiting - yesterdayWaiting;

  const countIdleOnDate = (date: Date, berthList: Berth[]) => {
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const occupied = new Set<string>();
    bookings.forEach((b) => {
      if (!b.berthId) return;
      if (b.status === 'cancelled') return;
      const etb = new Date(b.etb);
      const etd = new Date(b.etd);
      if (etd > dayStart && etb < dayEnd) {
        occupied.add(b.berthId);
      }
    });
    return berthList.filter(
      (b) => b.status !== 'maintenance' && !occupied.has(b.id)
    ).length;
  };

  const todayIdle = countIdleOnDate(today, berths);
  const yesterdayIdle = countIdleOnDate(yesterday, berths);
  const idleBerthsDelta = todayIdle - yesterdayIdle;

  const countAlertsOnDate = (date: Date) => {
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    let count = 0;
    bookings.forEach((b) => {
      if (b.status === 'departed' || b.status === 'cancelled') return;
      const eta = new Date(b.eta);
      if (!b.berthId && eta < now && eta >= dayStart && eta < dayEnd) {
        const hours = Math.floor(
          (now.getTime() - eta.getTime()) / (1000 * 60 * 60)
        );
        if (hours >= 2) count++;
      }
      if (b.status === 'berthed') {
        const etd = new Date(b.etd);
        if (now > etd && etd >= dayStart && etd < dayEnd) {
          count++;
        }
      }
    });
    return count;
  };

  const alertCount = countAlertsOnDate(today);
  const yesterdayAlertCount = countAlertsOnDate(yesterday);

  return {
    todayBerthedCount,
    yesterdayBerthedCount,
    waitingCountDelta,
    idleBerthsDelta,
    alertCount,
    yesterdayAlertCount,
  };
};

const initialDerived = computeDerived(initial.bookings, initial.berths);

export const usePortStore = create<PortState>((set, get) => {
  const persist = (ws: WaitingShip[]) => {
    saveWaitingOrder(ws.map((w) => w.id));
  };

  return {
    berths: initial.berths,
    bookings: initial.bookings,
    waitingShips: initial.waitingShips,
    notifications: initialNotifications,
    filters: defaultFilters,
    ...initialDerived,

  setFilters: (filters) =>
    set((s) => ({
      filters: { ...s.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  addBooking: (data) => {
    const now = new Date();
    const booking: Booking = {
      id: generateId(),
      shipName: data.shipName,
      imoNumber: data.imoNumber,
      nationality: data.nationality,
      dwt: Number(data.dwt) || 0,
      draft: Number(data.draft) || 0,
      length: Number(data.length) || 0,
      cargoType: data.cargoType as CargoType,
      cargoAmount: Number(data.cargoAmount) || 0,
      specialRequirements: data.specialRequirements,
      eta: new Date(data.eta),
      etb: new Date(data.etb),
      etd: new Date(data.etd),
      berthId: data.berthId ?? null,
      status: 'pending',
      agentId: data.agentId,
      agentName: data.agentName,
      rescheduleReason: data.rescheduleReason,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const newWaitingShips = [...state.waitingShips];
      if (!booking.berthId) {
        newWaitingShips.push({
          id: generateId(),
          bookingId: booking.id,
          priority: 'normal' as const,
          expectedWaitHours: 24,
        });
      }
      persist(newWaitingShips);
      const newBookings = [...state.bookings, booking];
      return {
        bookings: newBookings,
        waitingShips: newWaitingShips,
        ...computeDerived(newBookings, state.berths),
      };
    });
    return booking;
  },

  createBooking: (data, assignBerth = true) => {
    if (!data.etb || !data.etd) return null;
    const etb = new Date(data.etb);
    const etd = new Date(data.etd);
    const berthId = assignBerth ? data.berthId : null;
    if (berthId) {
      const conflict = get().detectConflict(etb, etd, berthId);
      if (conflict.hasConflict) return null;
    }
    const booking: Booking = {
      id: generateId(),
      shipName: data.shipName,
      imoNumber: data.imoNumber,
      nationality: data.nationality,
      dwt: Number(data.dwt) || 0,
      draft: Number(data.draft) || 0,
      length: Number(data.length) || 0,
      cargoType: data.cargoType as CargoType,
      cargoAmount: Number(data.cargoAmount) || 0,
      specialRequirements: data.specialRequirements,
      eta: new Date(data.eta),
      etb,
      etd,
      berthId,
      status: 'pending',
      agentId: data.agentId,
      agentName: data.agentName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => {
      const newWaitingShips = [...state.waitingShips];
      if (!booking.berthId) {
        newWaitingShips.push({
          id: generateId(),
          bookingId: booking.id,
          priority: 'normal' as const,
          expectedWaitHours: 24,
        });
      }
      persist(newWaitingShips);
      const newBookings = [...state.bookings, booking];
      return {
        bookings: newBookings,
        waitingShips: newWaitingShips,
        ...computeDerived(newBookings, state.berths),
      };
    });
    return booking;
  },

  updateBooking: (id, patch) =>
    set((s) => {
      const newBookings = s.bookings.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: new Date() } : b
      );
      return {
        bookings: newBookings,
        ...computeDerived(newBookings, s.berths),
      };
    }),

  updateBookingStatus: (id, status, rescheduleReason, newEtb, newEtd) => {
    set((state) => {
      const booking = state.bookings.find((b) => b.id === id);
      const patch: Partial<Booking> = { status, updatedAt: new Date() };
      if (rescheduleReason) {
        patch.rescheduleReason = rescheduleReason;
      }
      if (newEtb) patch.etb = newEtb;
      if (newEtd) patch.etd = newEtd;
      const newBookings = state.bookings.map((b) =>
        b.id === id ? { ...b, ...patch } : b
      );
      const updatedBooking = newBookings.find((b) => b.id === id);
      const newNotifications = [...state.notifications];
      if (rescheduleReason && booking && updatedBooking) {
        const fmt = (d: Date) => {
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        const berthName = updatedBooking.berthId
          ? state.berths.find((br) => br.id === updatedBooking.berthId)?.name || '未分配'
          : '未分配';
        const timeHint = newEtb || newEtd
          ? `，调整后靠泊时间：${fmt(updatedBooking.etb)}，离港时间：${fmt(updatedBooking.etd)}，泊位：${berthName}`
          : `，泊位：${berthName}`;
        newNotifications.unshift({
          id: generateId(),
          type: 'reschedule',
          title: '船舶靠泊计划调整',
          content: `${booking.shipName} 靠泊计划已调整${timeHint}，原因：${rescheduleReason}`,
          senderId: 'dispatcher001',
          senderName: '调度员张三',
          receiverId: booking.agentId,
          receiverName: booking.agentName,
          bookingId: booking.id,
          relatedShipName: booking.shipName,
          isRead: false,
          createdAt: new Date(),
        });
      }
      return {
        bookings: newBookings,
        notifications: newNotifications,
        ...computeDerived(newBookings, state.berths),
      };
    });
  },

  deleteBooking: (id) =>
    set((s) => {
      const newBookings = s.bookings.filter((b) => b.id !== id);
      const newWaitingShips = s.waitingShips.filter((w) => w.bookingId !== id);
      persist(newWaitingShips);
      return {
        bookings: newBookings,
        waitingShips: newWaitingShips,
        ...computeDerived(newBookings, s.berths),
      };
    }),

  getFilteredBookings: (search, status, date) => {
    const { bookings } = get();
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const searchLower = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      const etb = new Date(b.etb);
      const etd = new Date(b.etd);
      const eta = new Date(b.eta);
      const inRange =
        (etb >= dayStart && etb < dayEnd) ||
        (etd >= dayStart && etd < dayEnd) ||
        (eta >= dayStart && eta < dayEnd);
      if (!inRange) return false;
      if (searchLower) {
        const match =
          b.shipName.toLowerCase().includes(searchLower) ||
          (b.imoNumber?.toLowerCase().includes(searchLower) ?? false) ||
          b.agentName.toLowerCase().includes(searchLower) ||
          b.nationality.toLowerCase().includes(searchLower);
        if (!match) return false;
      }
      return true;
    });
  },

  assignBerth: (bookingId, berthId, etb, etd) => {
    const { bookings } = get();
    const conflict = get().detectConflict(etb, etd, berthId, bookingId);
    if (conflict.hasConflict) {
      return false;
    }
    set((state) => {
      const newBookings = state.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, berthId, etb, etd, updatedAt: new Date() }
          : b
      );
      const newWaitingShips = state.waitingShips.filter(
        (w) => w.bookingId !== bookingId
      );
      persist(newWaitingShips);
      return {
        bookings: newBookings,
        waitingShips: newWaitingShips,
        ...computeDerived(newBookings, state.berths),
      };
    });
    return true;
  },

  unassignBerth: (bookingId) => {
    set((state) => {
      const exists = state.waitingShips.some((w) => w.bookingId === bookingId);
      const newWaitingShips = exists
        ? state.waitingShips
        : [
            ...state.waitingShips,
            {
              id: generateId(),
              bookingId,
              priority: 'normal' as const,
              expectedWaitHours: 24,
            },
          ];
      persist(newWaitingShips);
      const newBookings = state.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, berthId: null, updatedAt: new Date() }
          : b
      );
      return {
        bookings: newBookings,
        waitingShips: newWaitingShips,
        ...computeDerived(newBookings, state.berths),
      };
    });
  },

  moveBookingOnCalendar: (bookingId, berthId, newEtb, newEtd) => {
    const conflict = get().detectConflict(newEtb, newEtd, berthId, bookingId);
    if (conflict.hasConflict) {
      return { success: false, conflict };
    }
    set((state) => {
      const newBookings = state.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              berthId,
              etb: newEtb,
              etd: newEtd,
              updatedAt: new Date(),
            }
          : b
      );
      const newWaitingShips = state.waitingShips.filter(
        (w) => w.bookingId !== bookingId
      );
      persist(newWaitingShips);
      return {
        bookings: newBookings,
        waitingShips: newWaitingShips,
        ...computeDerived(newBookings, state.berths),
      };
    });
    return { success: true };
  },

  detectConflict: (etb, etd, berthId, excludeId) => {
    const { bookings } = get();
    const sameBerth = bookings.filter(
      (b) =>
        b.berthId === berthId &&
        b.id !== excludeId &&
        b.status !== 'departed' &&
        b.status !== 'cancelled'
    );
    for (const existing of sameBerth) {
      const overlapStart = new Date(
        Math.max(etb.getTime(), existing.etb.getTime())
      );
      const overlapEnd = new Date(
        Math.min(etd.getTime(), existing.etd.getTime())
      );
      if (overlapStart < overlapEnd) {
        return {
          hasConflict: true,
          conflictWithBookingId: existing.id,
          conflictShipName: existing.shipName,
          overlapStart,
          overlapEnd,
        };
      }
    }
    return { hasConflict: false };
  },

  getBerthUtilization: (berthId) => {
    const { bookings } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const totalHours = 7 * 24;
    let occupiedHours = 0;
    bookings
      .filter(
        (b) =>
          b.berthId === berthId &&
          b.status !== 'cancelled' &&
          b.status !== 'departed'
      )
      .forEach((b) => {
        const start = new Date(Math.max(b.etb.getTime(), weekStart.getTime()));
        const end = new Date(Math.min(b.etd.getTime(), weekEnd.getTime()));
        if (end > start) {
          occupiedHours +=
            (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
      });
    return Math.round((occupiedHours / totalHours) * 100);
  },

  recommendBerths: (draft, dwt, length, cargoType) => {
    const { berths } = get();
    return berths
      .filter(
        (b) =>
          b.status !== 'maintenance' &&
          b.depth >= draft + 0.5 &&
          b.capacity >= dwt &&
          b.length >= length + 20 &&
          b.capabilities.includes(cargoType)
      )
      .sort(
        (a, b) =>
          get().getBerthUtilization(a.id) - get().getBerthUtilization(b.id)
      );
  },

  getFilteredBerths: () => {
    const { berths, filters } = get();
    return berths.filter((b) => {
      if (b.depth < filters.draftMin || b.depth > filters.draftMax)
        return false;
      if (filters.capabilities.length > 0) {
        const hasCap = filters.capabilities.some((c) =>
          b.capabilities.includes(c)
        );
        if (!hasCap) return false;
      }
      return true;
    });
  },

  getUnreadCount: (category) => {
    const { notifications } = get();
    if (category === 'all') {
      return notifications.filter((n) => !n.isRead).length;
    }
    return notifications.filter((n) => n.type === category && !n.isRead)
      .length;
  },

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  sendNotification: (...args: unknown[]) => {
    if (isObjectPartialNotification(args)) {
      const partial = args[0];
      const notification: Notification = {
        id: generateId(),
        senderId: partial.senderId ?? 'dispatcher001',
        senderName: partial.senderName ?? '调度员张三',
        receiverId: partial.receiverId ?? 'all',
        receiverName: partial.receiverName ?? '全员',
        isRead: false,
        createdAt: new Date(),
        ...partial,
      };
      set((s) => ({
        notifications: [notification, ...s.notifications],
      }));
    } else {
      const [
        type,
        title,
        content,
        receiverId,
        receiverName,
        bookingId,
        relatedShipName,
      ] = args as [
        NotificationType,
        string,
        string,
        string,
        string,
        string?,
        string?
      ];
      const notification: Notification = {
        id: generateId(),
        type,
        title,
        content,
        senderId: 'sys',
        senderName: '调度中心',
        receiverId,
        receiverName,
        bookingId,
        relatedShipName,
        isRead: false,
        createdAt: new Date(),
      };
      set((s) => ({
        notifications: [notification, ...s.notifications],
      }));
    }
  },

  filterNotifications: (category) => {
    const { notifications } = get();
    if (category === 'all') return notifications;
    return notifications.filter((n) => n.type === category);
  },

  clearWaitingShip: (bookingId) => {
    set((s) => {
      const newWaitingShips = s.waitingShips.filter((w) => w.bookingId !== bookingId);
      persist(newWaitingShips);
      return { waitingShips: newWaitingShips };
    });
  },

  reorderWaitingShips: (oldIndex, newIndex) => {
    set((s) => {
      const arr = [...s.waitingShips];
      const [moved] = arr.splice(oldIndex, 1);
      arr.splice(newIndex, 0, moved);
      persist(arr);
      return { waitingShips: arr };
    });
  },

  getTodayBerthedCount: () => get().todayBerthedCount,

  getWaitingCount: () => get().waitingShips.length,

  getAvailableBerthCount: () =>
    get().berths.filter((b) => b.status === 'available').length,

  getTimeoutCount: () => {
    const { bookings, waitingShips } = get();
    const now = new Date();
    return waitingShips.filter((w) => {
      const booking = bookings.find((b) => b.id === w.bookingId);
      if (!booking) return false;
      const eta = new Date(booking.eta);
      const diffMs = now.getTime() - eta.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > w.expectedWaitHours;
    }).length;
  },

  getTimeoutAlerts: () => {
    const { bookings } = get();
    const now = new Date();
    const alerts: TimeoutAlert[] = [];
    bookings.forEach((b) => {
      if (b.status === 'departed' || b.status === 'cancelled') return;
      if (!b.berthId) {
        const eta = new Date(b.eta);
        if (eta < now) {
          const hours = Math.floor(
            (now.getTime() - eta.getTime()) / (1000 * 60 * 60)
          );
          if (hours >= 2) {
            alerts.push({
              id: `eta-${b.id}`,
              type: 'eta_passed',
              shipName: b.shipName,
              hours,
              bookingId: b.id,
            });
          }
        }
      }
      if (b.status === 'berthed') {
        const etd = new Date(b.etd);
        if (now > etd) {
          const hours = Math.floor(
            (now.getTime() - etd.getTime()) / (1000 * 60 * 60)
          );
          if (hours >= 1) {
            alerts.push({
              id: `ot-${b.id}`,
              type: 'overtime',
              shipName: b.shipName,
              hours,
              bookingId: b.id,
            });
          }
        }
      }
    });
    return alerts.sort((a, b) => b.hours - a.hours);
  },
  };
});
