import { addDays, addHours } from 'date-fns';
import type {
  Berth,
  Booking,
  BookingStatus,
  CargoType,
  Notification,
  WaitingShip,
} from '../types';

/**
 * 生成8个泊位数据
 */
export function generateMockBerths(): Berth[] {
  const depths = [9.5, 12, 15, 10, 14, 11, 16, 13];
  const capacities = [50000, 80000, 150000, 60000, 120000, 70000, 200000, 100000];
  const lengths = [180, 220, 300, 200, 280, 200, 340, 250];
  const capabilitiesList: CargoType[][] = [
    ['general', 'container'],
    ['container', 'bulk'],
    ['bulk', 'liquid'],
    ['general'],
    ['container', 'general'],
    ['liquid', 'gas'],
    ['bulk', 'container', 'general'],
    ['liquid', 'general'],
  ];
  const statuses: Array<'available' | 'occupied' | 'maintenance'> = [
    'available',
    'occupied',
    'available',
    'maintenance',
    'occupied',
    'available',
    'occupied',
    'available',
  ];

  return depths.map((depth, i) => ({
    id: `berth-${i + 1}`,
    name: `${i + 1}号泊位`,
    depth,
    capacity: capacities[i],
    length: lengths[i],
    capabilities: capabilitiesList[i],
    status: statuses[i],
  }));
}

interface ShipConfig {
  name: string;
  nationality: string;
  dwt: number;
  draft: number;
  length: number;
  cargoType: CargoType;
  cargoAmount: number;
}

const SHIP_CONFIGS: ShipConfig[] = [
  { name: '中远之星', nationality: '中国', dwt: 65000, draft: 10.5, length: 225, cargoType: 'container', cargoAmount: 3200 },
  { name: '海蓝鲸', nationality: '巴拿马', dwt: 45000, draft: 9.2, length: 190, cargoType: 'bulk', cargoAmount: 45000 },
  { name: '太平洋号', nationality: '利比里亚', dwt: 120000, draft: 13.8, length: 280, cargoType: 'liquid', cargoAmount: 95000 },
  { name: '东方明珠', nationality: '中国', dwt: 35000, draft: 8.5, length: 170, cargoType: 'general', cargoAmount: 28000 },
  { name: '远洋先锋', nationality: '新加坡', dwt: 95000, draft: 12.5, length: 255, cargoType: 'container', cargoAmount: 5800 },
  { name: '海运雄狮', nationality: '中国香港', dwt: 78000, draft: 11.8, length: 240, cargoType: 'bulk', cargoAmount: 72000 },
  { name: '长江七号', nationality: '中国', dwt: 25000, draft: 7.2, length: 155, cargoType: 'general', cargoAmount: 20000 },
  { name: '蓝海明珠', nationality: '马绍尔群岛', dwt: 110000, draft: 13.2, length: 270, cargoType: 'liquid', cargoAmount: 88000 },
  { name: '琥珀号', nationality: '希腊', dwt: 55000, draft: 9.8, length: 210, cargoType: 'container', cargoAmount: 2800 },
  { name: '银河号', nationality: '中国', dwt: 150000, draft: 14.5, length: 320, cargoType: 'bulk', cargoAmount: 140000 },
  { name: '翡翠号', nationality: '巴哈马', dwt: 40000, draft: 8.8, length: 180, cargoType: 'general', cargoAmount: 35000 },
  { name: '星光号', nationality: '挪威', dwt: 85000, draft: 12.0, length: 250, cargoType: 'gas', cargoAmount: 65000 },
  { name: '金辉号', nationality: '中国', dwt: 60000, draft: 10.2, length: 220, cargoType: 'container', cargoAmount: 4200 },
  { name: '瑞丰号', nationality: '韩国', dwt: 72000, draft: 11.2, length: 235, cargoType: 'bulk', cargoAmount: 68000 },
  { name: '通达号', nationality: '中国', dwt: 30000, draft: 7.8, length: 165, cargoType: 'general', cargoAmount: 25000 },
  { name: '锦程号', nationality: '丹麦', dwt: 135000, draft: 14.0, length: 300, cargoType: 'liquid', cargoAmount: 110000 },
];

const AGENTS = [
  { id: 'agent-001', name: '中联船代' },
  { id: 'agent-002', name: '中外运代理' },
  { id: 'agent-003', name: '港务代理公司' },
  { id: 'agent-004', name: '环球海运服务' },
];

const STATUSES: BookingStatus[] = [
  'pending', 'pending', 'pending',
  'confirmed', 'confirmed', 'confirmed', 'confirmed',
  'berthed', 'berthed', 'berthed',
  'departed', 'departed',
  'pending', 'confirmed',
  'pending', 'confirmed',
];

/**
 * 生成16条预约数据
 */
export function generateMockBookings(base: Date): Booking[] {
  const bookings: Booking[] = [];

  for (let i = 0; i < 16; i++) {
    const cfg = SHIP_CONFIGS[i];
    const status = STATUSES[i];
    const agent = AGENTS[i % AGENTS.length];

    let dayOffset: number;
    if (status === 'departed') {
      dayOffset = i % 2 === 0 ? -3 : -2;
    } else if (status === 'berthed') {
      dayOffset = -1;
    } else if (status === 'confirmed') {
      dayOffset = i % 3;
    } else {
      dayOffset = (i % 3) + 1;
    }

    const baseHour = (i * 2) % 24;
    const eta = addHours(addDays(base, dayOffset), 6 + (i * 3) % 12);
    const etb = addHours(eta, (i % 4) + 2);
    const etd = addHours(etb, 12 + (i % 5) * 4);

    const berthAssignments = [0, 1, 2, 3, 4, 5, 6, 7];
    const berthId = i < 8
      ? `berth-${berthAssignments[i] + 1}`
      : null;

    const imoNumber = i % 3 === 0
      ? `IMO${9100000 + i * 137}`
      : undefined;

    const specialRequirements = i % 4 === 0 ? '需要拖轮协助'
      : i % 4 === 1 ? '夜间作业许可'
      : undefined;

    const rescheduleReason = i % 7 === 0 ? '恶劣天气' : undefined;

    const createdAt = addHours(eta, -48 - i);
    const updatedAt = addHours(createdAt, i * 2);

    bookings.push({
      id: `booking-${String(i + 1).padStart(3, '0')}`,
      shipName: cfg.name,
      imoNumber,
      nationality: cfg.nationality,
      dwt: cfg.dwt,
      draft: cfg.draft,
      length: cfg.length,
      cargoType: cfg.cargoType,
      cargoAmount: cfg.cargoAmount,
      specialRequirements,
      eta,
      etb,
      etd,
      berthId,
      status,
      agentId: agent.id,
      agentName: agent.name,
      rescheduleReason,
      createdAt,
      updatedAt,
    });
  }

  return bookings;
}

const NOTIFICATION_TYPES: Array<{
  type: Notification['type']; title: string; content: string }> = [
  { type: 'confirm', title: '预约确认通知', content: '您的船舶靠泊预约已确认，请按时抵达。' },
  { type: 'reschedule', title: '靠泊时间调整', content: '由于泊位调度原因，靠泊时间已调整，请查收最新时间表。' },
  { type: 'alert', title: '恶劣天气预警', content: '预计未来24小时内将有大风，请做好防范。' },
  { type: 'system', title: '系统维护通知', content: '系统将于今晚22:00-24:00进行维护。' },
  { type: 'custom', title: '泊位变更通知', content: '您申请的泊位已变更，请知悉。' },
  { type: 'confirm', title: '预约确认通知', content: '集装箱装卸作业时间已确认。' },
  { type: 'alert', title: '潮汐提醒', content: '当前低潮位，请关注船舶吃水深度。' },
  { type: 'reschedule', title: '离港时间延后', content: '由于装卸延迟，预计离港时间延后2小时。' },
  { type: 'system', title: '新版本上线', content: '泊位预约系统已升级至v2.1。' },
  { type: 'confirm', title: '进港许可已签发', content: '船舶进港许可已成功签发。' },
  { type: 'alert', title: '危险品作业审批', content: '危险品作业申请已通过审批。' },
  { type: 'custom', title: '服务评价邀请', content: '邀请您对本次靠泊服务进行评价。' },
];

/**
 * 生成12条通知消息
 */
export function generateMockNotifications(): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const tpl = NOTIFICATION_TYPES[i];
    const isRead = i >= 5;
    const relatedBooking = i < 8 ? `booking-${String((i % 16) + 1).padStart(3, '0')}` : undefined;
    const relatedShip = i < 8 ? SHIP_CONFIGS[i % 16].name : undefined;

    notifications.push({
      id: `notif-${i + 1}`,
      type: tpl.type,
      title: tpl.title,
      content: tpl.content,
      senderId: i % 2 === 0 ? 'system' : 'admin',
      senderName: i % 2 === 0 ? '港口调度中心' : '系统管理员',
      receiverId: 'user-001',
      receiverName: '张先生',
      bookingId: relatedBooking,
      relatedShipName: relatedShip,
      isRead,
      createdAt: addHours(now, -(i * 3)),
    });
  }

  return notifications;
}

/**
 * 根据预约生成等待队列船舶
 */
export function generateMockWaitingShips(bookings: Booking[]): WaitingShip[] {
  const waitingBookings = bookings.filter(
    (b) => b.berthId === null && b.status !== 'departed' && b.status !== 'cancelled'
  );

  return waitingBookings.map((b, i) => ({
    id: `wait-${b.id}`,
    bookingId: b.id,
    priority: i < 2 ? 'high' : i < 5 ? 'normal' : 'low',
    expectedWaitHours: Math.round(4 + i * 2.5) / 1,
  }));
}

/**
 * 初始化港口全部Mock数据
 */
export function initPortData() {
  const base = new Date();
  const berths = generateMockBerths();
  const bookings = generateMockBookings(base);
  const notifications = generateMockNotifications();
  const waitingShips = generateMockWaitingShips(bookings);

  return { berths, bookings, notifications, waitingShips };
}
