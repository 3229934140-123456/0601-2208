import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Berth, Booking, ConflictInfo, WaitingShip } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function detectConflict(
  bookings: Booking[],
  berthId: string,
  etb: Date,
  etd: Date,
  excludeBookingId?: string
): ConflictInfo {
  for (const booking of bookings) {
    if (excludeBookingId && booking.id === excludeBookingId) continue
    if (!booking.berthId || booking.berthId !== berthId) continue
    if (booking.status === "departed" || booking.status === "cancelled") continue

    const bEtb = new Date(booking.etb)
    const bEtd = new Date(booking.etd)
    const nEtb = new Date(etb)
    const nEtd = new Date(etd)

    const overlapStart = bEtb > nEtb ? bEtb : nEtb
    const overlapEnd = bEtd < nEtd ? bEtd : nEtd

    if (overlapStart < overlapEnd) {
      return {
        hasConflict: true,
        conflictWithBookingId: booking.id,
        conflictShipName: booking.shipName,
        overlapStart,
        overlapEnd,
      }
    }
  }
  return { hasConflict: false }
}

export interface InitPortDataResult {
  berths: Berth[]
  bookings: Booking[]
  waitingShips: WaitingShip[]
}

export function initPortData(): InitPortDataResult {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const addHours = (d: Date, h: number) => {
    const nd = new Date(d)
    nd.setHours(nd.getHours() + h)
    return nd
  }
  const addDays = (d: Date, days: number) => {
    const nd = new Date(d)
    nd.setDate(nd.getDate() + days)
    return nd
  }

  const berths: Berth[] = [
    { id: "B001", name: "1号泊位", depth: 15, capacity: 100000, length: 300, capabilities: ["container", "general"], status: "available" },
    { id: "B002", name: "2号泊位", depth: 18, capacity: 150000, length: 350, capabilities: ["container", "bulk", "general"], status: "available" },
    { id: "B003", name: "3号泊位", depth: 20, capacity: 200000, length: 400, capabilities: ["bulk", "liquid"], status: "occupied" },
    { id: "B004", name: "4号泊位", depth: 12, capacity: 50000, length: 200, capabilities: ["general", "container"], status: "available" },
    { id: "B005", name: "5号泊位", depth: 22, capacity: 300000, length: 450, capabilities: ["liquid", "gas", "bulk"], status: "maintenance" },
    { id: "B006", name: "6号泊位", depth: 16, capacity: 120000, length: 320, capabilities: ["container", "general"], status: "available" },
  ]

  const bookings: Booking[] = [
    {
      id: "BK001", shipName: "远洋明珠号", imoNumber: "IMO9700001", nationality: "中国",
      dwt: 85000, draft: 13.5, length: 280, cargoType: "container", cargoAmount: 4200,
      specialRequirements: "冷藏集装箱", eta: addHours(today, -6), etb: addHours(today, -2), etd: addHours(today, 18),
      berthId: "B003", status: "berthed", agentId: "A001", agentName: "中国外轮代理",
      createdAt: addDays(today, -3), updatedAt: addHours(today, -2),
    },
    {
      id: "BK002", shipName: "东方之星", imoNumber: "IMO9700002", nationality: "巴拿马",
      dwt: 65000, draft: 11.8, length: 250, cargoType: "bulk", cargoAmount: 58000,
      eta: addHours(today, 4), etb: addHours(today, 8), etd: addHours(today, 32),
      berthId: "B002", status: "confirmed", agentId: "A002", agentName: "环球船务",
      createdAt: addDays(today, -5), updatedAt: addDays(today, -1),
    },
    {
      id: "BK003", shipName: "海龙号", imoNumber: "IMO9700003", nationality: "中国",
      dwt: 120000, draft: 15.2, length: 340, cargoType: "container", cargoAmount: 8500,
      eta: addHours(today, 8), etb: addHours(today, 20), etd: addDays(today, 2),
      berthId: null, status: "pending", agentId: "A001", agentName: "中国外轮代理",
      createdAt: addDays(today, -2), updatedAt: addDays(today, -2),
    },
  ]

  const waitingShips: WaitingShip[] = [
    { id: "W001", bookingId: "BK003", priority: "normal", expectedWaitHours: 12 },
  ]

  return { berths, bookings, waitingShips }
}
