// Renders the app icons (pixel crab on a dusk gradient) as PNGs with zero deps.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CRAB = [
  '................',
  '..RR........RR..',
  '..RR.RRRRRR.RR..',
  '..RRRRRRRRRRRR..',
  '....RBWRRBWR....',
  '....RBBRRBBR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RR.RR.RR....',
  '....RR.RR.RR....',
  '................',
]

const PALETTE = {
  R: [201, 107, 74, 255],
  B: [32, 20, 15, 255],
  W: [255, 233, 214, 255],
}

const crc32 = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return (buf) => {
    let c = -1
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ -1) >>> 0
  }
})()

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // rgba
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const lerp = (a, b, t) => Math.round(a + (b - a) * t)

function renderIcon(size, { crabRatio = 0.052, glow = true } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const top = [24, 32, 44]
  const bottom = [16, 20, 26]
  const cx = size / 2
  const cy = size / 2
  for (let y = 0; y < size; y++) {
    const t = y / size
    for (let x = 0; x < size; x++) {
      let r = lerp(top[0], bottom[0], t)
      let g = lerp(top[1], bottom[1], t)
      let b = lerp(top[2], bottom[2], t)
      if (glow) {
        const d = Math.hypot(x - cx, y - cy * 1.05) / (size * 0.52)
        const k = Math.max(0, 1 - d) ** 2 * 0.5
        r = Math.min(255, r + 255 * k * 0.28)
        g = Math.min(255, g + 176 * k * 0.22)
        b = Math.min(255, b + 105 * k * 0.14)
      }
      const i = (y * size + x) * 4
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = 255
    }
  }
  const cell = Math.round(size * crabRatio)
  const w = 16 * cell
  const h = 12 * cell
  const ox = Math.round((size - w) / 2)
  const oy = Math.round((size - h) / 2)
  for (let ry = 0; ry < 12; ry++) {
    for (let rx = 0; rx < 16; rx++) {
      const color = PALETTE[CRAB[ry][rx]]
      if (!color) continue
      for (let dy = 0; dy < cell; dy++) {
        for (let dx = 0; dx < cell; dx++) {
          const X = ox + rx * cell + dx
          const Y = oy + ry * cell + dy
          if (X < 0 || Y < 0 || X >= size || Y >= size) continue
          const i = (Y * size + X) * 4
          px[i] = color[0]
          px[i + 1] = color[1]
          px[i + 2] = color[2]
          px[i + 3] = 255
        }
      }
    }
  }
  return encodePng(size, size, px)
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'icon-180.png'), renderIcon(180))
writeFileSync(join(out, 'icon-192.png'), renderIcon(192))
writeFileSync(join(out, 'icon-512.png'), renderIcon(512))
writeFileSync(join(out, 'icon-512-maskable.png'), renderIcon(512, { crabRatio: 0.04 }))
console.log('icons written to', out)
