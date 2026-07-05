/* Soft two-note bell rendered with Web Audio — no asset, works offline. */
let ctx: AudioContext | null = null

function tone(when: number, freq: number, dur: number, gain: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(gain, when + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(when)
  osc.stop(when + dur + 0.05)
}

export function chime(kind: 'done' | 'break' = 'done') {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime + 0.02
    if (kind === 'done') {
      tone(t, 830.6, 1.6, 0.12) // G#5
      tone(t + 0.22, 1244.5, 2.2, 0.09) // D#6
    } else {
      tone(t, 622.3, 1.8, 0.1) // D#5
      tone(t + 0.25, 830.6, 2.4, 0.07)
    }
  } catch {
    /* audio not available — stay silent */
  }
}
