import type { Booking, Berth } from '../types';
import { formatDateTime, formatDate } from './timeUtils';

const CARGO_TYPE_LABEL: Record<string, string> = {
  container: '集装箱',
  bulk: '散货',
  liquid: '液体',
  gas: '气体',
  general: '杂货',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  berthed: '已靠泊',
  departed: '已离港',
  cancelled: '已取消',
};

/**
 * 转义CSV字段，处理特殊字符
 */
function escapeField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 导出当日靠泊清单为CSV文件
 */
export function exportTodayBookings(bookings: Booking[], berths: Berth[]): void {
  const today = new Date();
  const todayStr = formatDate(today);

  const berthMap = new Map<string, Berth>();
  berths.forEach((b) => berthMap.set(b.id, b));

  const headers = [
    '船名',
    '国籍',
    '吨位(DWT)',
    '吃水(m)',
    '货类',
    '货量',
    '泊位',
    'ETA',
    'ETB',
    'ETD',
    '状态',
    '船代',
    '改期原因',
  ];

  const rows = bookings
    .filter((b) => {
      const etbDate = formatDate(b.etb);
      const etdDate = formatDate(b.etd);
      return etbDate === todayStr || etdDate === todayStr || (formatDate(b.eta) === todayStr);
    })
    .sort((a, b) => a.etb.getTime() - b.etb.getTime())
    .map((b) => {
      const berth = b.berthId ? berthMap.get(b.berthId) : null;
      return [
        b.shipName,
        b.nationality,
        b.dwt,
        b.draft,
        CARGO_TYPE_LABEL[b.cargoType] || b.cargoType,
        b.cargoAmount,
        berth ? berth.name : '待分配',
        formatDateTime(b.eta),
        formatDateTime(b.etb),
        formatDateTime(b.etd),
        STATUS_LABEL[b.status] || b.status,
        b.agentName,
        b.rescheduleReason || '',
      ];
    });

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeField).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const fileName = `靠泊清单_${todayStr}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
