import { THEMES, type LockState } from '../types.ts'
import { currentIndex } from '../lib/presets.ts'
import { pad, remaining } from '../lib/time.ts'

const WIDTH = 1170
const HEIGHT = 2532

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length === maxLines - 1) break
    } else {
      current = next
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export async function renderWallpaper(glSnapshot: HTMLCanvasElement, state: LockState, now: number): Promise<Blob> {
  await document.fonts.ready
  await Promise.all([
    document.fonts.load("400 28px Outfit"),
    document.fonts.load("500 84px Fraunces"),
    document.fonts.load("italic 500 84px Fraunces"),
    document.fonts.load("300 120px 'DM Mono'"),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create the wallpaper canvas.')

  ctx.drawImage(glSnapshot, 0, 0, WIDTH, HEIGHT)

  const accent = THEMES[state.theme].color
  const bandTop = HEIGHT * 0.32
  const bandBottom = HEIGHT * 0.84
  const padX = 96

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, bandTop - 40, WIDTH, bandBottom - bandTop + 80)
  ctx.clip()
  ctx.filter = 'blur(22px)'
  ctx.drawImage(glSnapshot, 0, 0, WIDTH, HEIGHT)
  ctx.filter = 'none'
  const veil = ctx.createLinearGradient(0, bandTop - 20, 0, bandBottom + 20)
  veil.addColorStop(0, 'rgba(8,9,12,0)')
  veil.addColorStop(0.1, 'rgba(8,9,12,0.5)')
  veil.addColorStop(0.5, 'rgba(8,9,12,0.66)')
  veil.addColorStop(0.9, 'rgba(8,9,12,0.5)')
  veil.addColorStop(1, 'rgba(8,9,12,0)')
  ctx.fillStyle = veil
  ctx.fillRect(0, bandTop - 40, WIDTH, bandBottom - bandTop + 80)
  ctx.restore()

  const edge = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.42, HEIGHT * 0.2, WIDTH / 2, HEIGHT * 0.5, HEIGHT * 0.72)
  edge.addColorStop(0, 'rgba(0,0,0,0)')
  edge.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  let y = bandTop + 36
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = '600 26px Outfit'
  ctx.letterSpacing = '0.22em'
  const eyebrow = 'COUNTING DOWN'
  const eyebrowWidth = ctx.measureText(eyebrow).width
  ctx.fillStyle = 'rgba(8,9,12,0.88)'
  roundedRect(ctx, padX - 18, y - 10, eyebrowWidth + 36, 48, 24)
  ctx.fill()
  ctx.strokeStyle = 'rgba(246,241,231,0.16)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#f7f3ea'
  ctx.fillText(eyebrow, padX, y + 4)
  ctx.letterSpacing = '0px'

  y += 52
  ctx.fillStyle = '#f6f1e7'
  ctx.font = "italic 500 78px Fraunces"
  const titleLines = wrap(ctx, state.title || 'Untitled deadline', WIDTH - padX * 2, 2)
  for (const line of titleLines) {
    ctx.fillText(line, padX, y)
    y += 88
  }

  y += 28
  const parts = remaining(state.target, now)
  const values = [
    pad(parts.days, parts.days > 99 ? 3 : 2),
    pad(parts.hours),
    pad(parts.mins),
    pad(parts.secs),
  ]
  const labels = ['Days', 'Hours', 'Mins', 'Secs']
  const digitFont = "300 104px 'DM Mono'"
  const colonFont = "300 68px 'DM Mono'"
  ctx.font = digitFont
  const digitWidths = values.map((value) => ctx.measureText(value).width)
  ctx.font = colonFont
  const colonWidth = ctx.measureText(':').width
  const gap = 28
  const origins: number[] = []
  let cursor = padX
  const digitTop = y
  for (let i = 0; i < 4; i += 1) {
    origins.push(cursor)
    ctx.font = digitFont
    ctx.fillStyle = '#f7f3ea'
    ctx.globalAlpha = 1
    ctx.fillText(values[i], cursor, digitTop)
    cursor += digitWidths[i]
    if (i < 3) {
      cursor += gap
      ctx.font = colonFont
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.85
      ctx.fillText(':', cursor, digitTop + 22)
      ctx.globalAlpha = 1
      cursor += colonWidth + gap
    }
  }
  y = digitTop + 118
  ctx.font = '500 22px Outfit'
  ctx.letterSpacing = '0.2em'
  ctx.fillStyle = '#d9d2c6'
  for (let i = 0; i < 4; i += 1) {
    ctx.fillText(labels[i].toUpperCase(), origins[i], y)
  }
  ctx.letterSpacing = '0px'

  if (parts.arrived) {
    y += 46
    ctx.font = 'italic 400 34px Fraunces'
    ctx.fillStyle = accent
    ctx.fillText('The hour has arrived.', padX, y)
  }

  y += parts.arrived ? 78 : 72
  const current = currentIndex(state.milestones)
  const rowH = 108
  for (let i = 0; i < state.milestones.length; i += 1) {
    const item = state.milestones[i]
    const status = item.done ? 'done' : i === current ? 'current' : 'upcoming'
    const rowY = y
    if (status === 'current') {
      ctx.save()
      roundedRect(ctx, padX - 28, rowY - 22, WIDTH - padX * 2 + 56, rowH - 8, 28)
      ctx.fillStyle = 'rgba(246,241,231,0.05)'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.shadowColor = accent
      ctx.shadowBlur = 24
      ctx.stroke()
      ctx.restore()
    }

    const cx = padX + 8
    const cy = rowY + 18
    ctx.beginPath()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = status === 'done' ? '#b7b1a6' : status === 'current' ? accent : '#f6f1e7'
    ctx.arc(cx + 16, cy + 16, 16, 0, Math.PI * 2)
    ctx.stroke()
    if (status === 'current') {
      ctx.beginPath()
      ctx.fillStyle = accent
      ctx.arc(cx + 16, cy + 16, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    if (status === 'done') {
      ctx.beginPath()
      ctx.strokeStyle = '#d9d3c7'
      ctx.lineWidth = 2.6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(cx + 8, cy + 17)
      ctx.lineTo(cx + 14, cy + 24)
      ctx.lineTo(cx + 26, cy + 10)
      ctx.stroke()
    }

    const textX = padX + 64
    if (status === 'current') {
      ctx.font = '600 18px Outfit'
      ctx.letterSpacing = '0.2em'
      ctx.fillStyle = accent
      ctx.fillText('NEXT UP', textX, rowY - 2)
      ctx.letterSpacing = '0px'
      ctx.font = '500 36px Outfit'
      ctx.fillStyle = '#f7f3ea'
      ctx.fillText(item.label, textX, rowY + 28)
    } else {
      ctx.font = '400 34px Outfit'
      ctx.fillStyle = status === 'done' ? '#b7b1a6' : '#e6e0d4'
      ctx.fillText(item.label, textX, rowY + 10)
    }
    y += rowH
  }

  if (current === -1 && state.milestones.length > 0) {
    ctx.font = 'italic 400 32px Fraunces'
    ctx.fillStyle = accent
    ctx.fillText('Every step kept.', padX, y + 8)
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Could not encode the wallpaper.'))
    }, 'image/png')
  })
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function wallpaperName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `meridian-${slug || 'lock'}.png`
}
