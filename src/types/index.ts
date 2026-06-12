export type CargoType = 'container' | 'bulk' | 'liquid' | 'gas' | 'general';

export type BookingStatus = 'pending' | 'confirmed' | 'berthed' | 'departed' | 'cancelled';

export interface Berth {
  id: string;
  name: string;
  depth: number;
  capacity: number;
  length: number;
  capabilities: CargoType[];
  status: 'available' | 'occupied' | 'maintenance';
}

export interface Booking {
  id: string;
  shipName: string;
  imoNumber?: string;
  nationality: string;
  dwt: number;
  draft: number;
  length: number;
  cargoType: CargoType;
  cargoAmount: number;
  specialRequirements?: string;
  eta: Date;
  etb: Date;
  etd: Date;
  berthId: string | null;
  status: BookingStatus;
  agentId: string;
  agentName: string;
  rescheduleReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitingShip {
  id: string;
  bookingId: string;
  priority: 'high' | 'normal' | 'low';
  expectedWaitHours: number;
}

export interface Notification {
  id: string;
  type: 'confirm' | 'reschedule' | 'alert' | 'system' | 'custom';
  title: string;
  content: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  bookingId?: string;
  relatedShipName?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflictWithBookingId?: string;
  conflictShipName?: string;
  overlapStart?: Date;
  overlapEnd?: Date;
}

export interface BookingFormData {
  shipName: string;
  imoNumber?: string;
  nationality: string;
  dwt: number | '';
  draft: number | '';
  length: number | '';
  cargoType: CargoType | '';
  cargoAmount: number | '';
  specialRequirements?: string;
  eta: string;
  etb: string;
  etd: string;
  berthId: string | null;
  agentId: string;
  agentName: string;
  rescheduleReason?: string;
}

export type ViewMode = 'day' | 'week' | 'month';

export const CARGO_LABELS: Record<CargoType, string> = {
  container: '集装箱',
  bulk: '散货',
  liquid: '液体',
  gas: '气体',
  general: '杂货',
};

export interface CalendarFilters {
  draftMin: number;
  draftMax: number;
  capabilities: CargoType[];
}

export type NotificationCategory = 'all' | Notification['type'];

export type NotificationType = Notification['type'];

export interface TimeoutAlert {
  id: string;
  type: 'eta_passed' | 'overtime';
  shipName: string;
  hours: number;
  bookingId?: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationCategory, string> = {
  all: '全部',
  confirm: '确认',
  reschedule: '改期',
  alert: '提醒',
  system: '系统',
  custom: '自定义',
};
