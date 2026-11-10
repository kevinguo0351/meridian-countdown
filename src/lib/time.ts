import { PROGRESS_WINDOW_MS } from '../types.ts'

export type Remaining = {
  days: number
  hours: number
  mins: number
  secs: number
  arrived: boolean
}

export function pad(value: number, length = 2): string {
  return String(Math.max(0, value)).padStart(length, '0')
}

export function remaining(target: number, now: number): Remaining {
  const delta = target - now
  if (delta <= 0) {
    return { days: 0, hours: 0, mins: 0, secs: 0, arrived: true }
  }
  const days = Math.floor(delta / 86_400_000)
  const hours = Math.floor((delta % 86_400_000) / 3_600_000)
  const mins = Math.floor((delta % 3_600_000) / 60_000)
  const secs = Math.floor((delta % 60_000) / 1000)
  return { days, hours, mins, secs, arrived: false }
}

export function progressRatio(target: number, now: number): number {
  const left = Math.max(0, target - now)
  return Math.min(1, left / PROGRESS_WINDOW_MS)
}

export function horizonLabel(target: number, now: number): string {
  const left = remaining(target, now)
  if (left.arrived) return 'The hour has arrived'
  if (left.days === 0) return `${left.hours}h ${pad(left.mins)}m left`
  return `${left.days}d ${pad(left.hours)}h left`
}

export function moodLine(target: number, now: number): string {
  const left = remaining(target, now)
  if (left.arrived) return 'The hour has arrived.'
  const ratio = progressRatio(target, now)
  if (ratio > 0.66) return 'Plenty of runway.'
  if (ratio > 0.33) return 'The light is warming.'
  return 'Close now. Keep the pace.'
}

export function toDatetimeLocal(ms: number): string {
  const date = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

export function formatDate(now: number): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)
}

export function formatClock(now: number): { time: string; ampm: string } {
  const date = new Date(now)
  let hours = date.getHours()
  const mins = pad(date.getMinutes())
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return { time: `${hours}:${mins}`, ampm }
}
