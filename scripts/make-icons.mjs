import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(root, { recursive: true })

function crc32(buffer) {
  let crc = ~0
  for (const byte of buffer) {
    crc ^= byte
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return ~crc >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const name = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y, size)
      const offset = row + 1 + x * 4
      raw[offset] = r
      raw[offset + 1] = g
      raw[offset + 2] = b
      raw[offset + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function icon(size) {
  return png(size, (x, y, s) => {
    const nx = (x + 0.5) / s
    const ny = (y + 0.5) / s
    const dx = nx - 0.5
    const dy = ny - 0.5
    const d = Math.hypot(dx, dy)
    const margin = 0.08
    const inside =
      nx > margin && nx < 1 - margin && ny > margin && ny < 1 - margin
    if (!inside) return [11, 12, 14, 0]
    let r = 12
    let g = 13
    let b = 16
    const ring = Math.abs(d - 0.28)
    const ring2 = Math.abs(d - 0.18)
    if (ring < 0.012) {
      r = 224
      g = 177
      b = 92
    } else if (ring2 < 0.007) {
      r = 224
      g = 177
      b = 92
    }
    const crystal =
      Math.abs(dx) * 2.4 + Math.abs(dy - 0.02) < 0.09 && Math.abs(dx) < 0.045 + (0.08 - Math.abs(dy)) * 0.2
    if (Math.abs(dx) < 0.018 && Math.abs(dy) < 0.11) {
      r = 246
      g = 241
      b = 231
    }
    void crystal
    return [r, g, b, 255]
  })
}

writeFileSync(join(root, 'icon-192.png'), icon(192))
writeFileSync(join(root, 'icon-512.png'), icon(512))
writeFileSync(join(root, 'apple-touch-icon.png'), icon(180))
console.log('icons written')
