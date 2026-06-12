import {
  format,
  addHours,
  addDays,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isEqual,
} from 'date-fns';
import type { Booking, ConflictInfo } from '../types';

/**
 * 格式化日期时间为 yyyy-MM-dd HH:mm 格式
 */
export function formatDateTime(d: Date): string {
  return format(d, 'yyyy-MM-dd HH:mm');
}

/**
 * 格式化日期为 yyyy-MM-dd 格式
 */
export function formatDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

/**
 * 格式化时间为 HH:mm 格式
 */
export function formatTime(d: Date): string {
  return format(d, 'HH:mm');
}

/**
 * 计算两个时间之间的小时差，保留1位小数
 */
export function durationHours(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10;
}

/**
 * 检测新预约与已有预约是否存在时间冲突
 * 区间交叠判断：A.etb < B.etd && A.etd > B.etb
 * 排除状态为 departed 或 cancelled 的预约
 */
export function detectConflict(
  newB: { etb: Date; etd: Date; berthId: string | null; excludeId?: string },
  bookings: Booking[]
): ConflictInfo {
  if (!newB.berthId) {
    return { hasConflict: false };
  }

  for (const b of bookings) {
    if (b.id === newB.excludeId) continue;
    if (b.berthId !== newB.berthId) continue;
    if (b.status === 'departed' || b.status === 'cancelled') continue;

    const hasOverlap = isBefore(newB.etb, b.etd) && isAfter(newB.etd, b.etb);
    if (hasOverlap) {
      const overlapStart = newB.etb.getTime() > b.etb.getTime() ? newB.etb : b.etb;
      const overlapEnd = newB.etd.getTime() < b.etd.getTime() ? newB.etd : b.etd;
      return {
        hasConflict: true,
        conflictWithBookingId: b.id,
        conflictShipName: b.shipName,
        overlapStart,
        overlapEnd,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * 验证时间顺序是否合法：eta <= etb && etb < etd
 */
export function isTimeValid(eta: Date, etb: Date, etd: Date): boolean {
  const etaOk = isBefore(eta, etb) || isEqual(eta, etb);
  const etbOk = isBefore(etb, etd);
  return etaOk && etbOk;
}

/**
 * 获取一天的起始时间
 */
export function getStartOfDay(d: Date): Date {
  return startOfDay(d);
}

/**
 * 获取一天的结束时间
 */
export function getEndOfDay(d: Date): Date {
  return endOfDay(d);
}

/**
 * 在指定日期上增加天数
 */
export function addDaysOffset(d: Date, days: number): Date {
  return addDays(d, days);
}

/**
 * 在指定日期上增加小时数
 */
export function addHoursOffset(d: Date, hours: number): Date {
  return addHours(d, hours);
}
