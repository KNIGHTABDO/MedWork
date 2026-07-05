/* Pixel — the little crab. Frames are pixel matrices drawn to canvas,
   so he stays crisp at any scale and is easy to redraw. */

export const SPRITE_W = 16
export const SPRITE_H = 12
export const SPRITE_SCALE = 5

const PALETTE: Record<string, string> = {
  R: '#c96b4a', // coral body
  D: '#a3503a', // shade
  B: '#20140f', // eyes
  W: '#ffe9d6', // eye glint
}

export type AnimName = 'idle' | 'blink' | 'walk' | 'sleep' | 'happy' | 'tap'

// prettier-ignore
const IDLE = [
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

// prettier-ignore
const IDLE2 = [
  '................',
  '................',
  '..RR.RRRRRR.RR..',
  '..RRRRRRRRRRRR..',
  '....RBWRRBWR....',
  '....RBBRRBBR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RR.RR.RR....',
  '................',
]

// prettier-ignore
const BLINK = [
  '................',
  '..RR........RR..',
  '..RR.RRRRRR.RR..',
  '..RRRRRRRRRRRR..',
  '....RRRRRRRR....',
  '....RDDRRDDR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RR.RR.RR....',
  '....RR.RR.RR....',
  '................',
]

// prettier-ignore
const WALK_A = [
  '................',
  '..RR........RR..',
  '..RR.RRRRRR.RR..',
  '..RRRRRRRRRRRR..',
  '....RBWRRBWR....',
  '....RBBRRBBR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '...RR..RR..RR...',
  '...RR..RR..RR...',
  '................',
]

// prettier-ignore
const WALK_B = [
  '................',
  '..RR........RR..',
  '..RR.RRRRRR.RR..',
  '..RRRRRRRRRRRR..',
  '....RBWRRBWR....',
  '....RBBRRBBR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '.....RR.RR.RR...',
  '.....RR.RR.RR...',
  '................',
]

// prettier-ignore
const SLEEP = [
  '................',
  '................',
  '................',
  '..RR.RRRRRR.RR..',
  '..RRRRRRRRRRRR..',
  '....RRRRRRRR....',
  '....RDDRRDDR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RR.RR.RR....',
  '................',
]

// prettier-ignore
const HAPPY_A = [
  '.RR..........RR.',
  '.RR..RRRRRR..RR.',
  '.RRRRRRRRRRRRRR.',
  '....RBWRRBWR....',
  '....RBBRRBBR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '...RR..RR..RR...',
  '...RR..RR..RR...',
  '................',
  '................',
]

// prettier-ignore
const HAPPY_B = [
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

// prettier-ignore
const TAP = [
  '................',
  '..RR............',
  '..RR.RRRRRR.....',
  '..RRRRRRRRRRRRRR',
  '....RBWRRBWR.RR.',
  '....RBBRRBBR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RRRRRRRR....',
  '....RR.RR.RR....',
  '....RR.RR.RR....',
  '................',
]

export const ANIMS: Record<AnimName, { frames: string[][]; ms: number }> = {
  idle: { frames: [IDLE, IDLE, IDLE, IDLE2], ms: 900 },
  blink: { frames: [BLINK], ms: 140 },
  walk: { frames: [WALK_A, WALK_B], ms: 160 },
  sleep: { frames: [SLEEP], ms: 1200 },
  happy: { frames: [HAPPY_A, HAPPY_B], ms: 220 },
  tap: { frames: [TAP, IDLE, TAP], ms: 200 },
}

export function drawFrame(ctx: CanvasRenderingContext2D, frame: string[], flip: boolean) {
  ctx.clearRect(0, 0, SPRITE_W * SPRITE_SCALE, SPRITE_H * SPRITE_SCALE)
  ctx.save()
  if (flip) {
    ctx.translate(SPRITE_W * SPRITE_SCALE, 0)
    ctx.scale(-1, 1)
  }
  for (let y = 0; y < frame.length; y++) {
    const row = frame[y]
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x * SPRITE_SCALE, y * SPRITE_SCALE, SPRITE_SCALE, SPRITE_SCALE)
    }
  }
  ctx.restore()
}
