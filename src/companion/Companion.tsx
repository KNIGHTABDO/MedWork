import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { ANIMS, drawFrame, SPRITE_H, SPRITE_SCALE, SPRITE_W, type AnimName } from './sprite'
import { intentToStep } from './actions'
import { parseIntent, FALLBACK_REPLY } from './brain/parser'
import { activeKey, askBrain } from './brain'

const W = SPRITE_W * SPRITE_SCALE
const H = SPRITE_H * SPRITE_SCALE
const SPEED = 170 // px/s
const EDGE = 14

const BRAIN_ERRORS: Record<string, string> = {
  'no-key': FALLBACK_REPLY,
  'bad-key': 'that api key doesn’t seem right — check settings 🔑',
  'bad-model': 'that model didn’t answer — pick another one in settings 🤖',
  'rate-limit': 'my brain needs a tiny break (rate limit) — try again in a moment 🫧',
  network: 'i can’t reach my big brain right now 🌧 simple commands still work',
  empty: 'my thoughts got lost… try again?',
}

export function Companion() {
  const chatOpen = useStore((s) => s.chatOpen)
  const setChatOpen = useStore((s) => s.setChatOpen)
  const [say, setSay] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const [sleeping, setSleeping] = useState(false)
  const [input, setInput] = useState('')

  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ctl = useRef({
    x: 0,
    yOff: 0, // height above the ground line (drag & drop)
    facing: 1,
    anim: 'idle' as AnimName,
    animUntil: 0, // for one-shot anims (happy/tap/blink)
    target: null as null | { x: number; resolve: () => void },
    drag: null as null | { startX: number; startY: number; baseX: number; baseY: number; moved: boolean },
    frameIdx: 0,
    frameAt: 0,
    lastDrawnKey: '',
    lastInteraction: Date.now(),
    nextWander: Date.now() + 9000,
    nextBlink: Date.now() + 3000,
    nextHydrate: Date.now() + 45 * 60_000,
    busy: false,
  })

  const sayTimer = useRef<number>(undefined)
  const speak = useCallback((text: string, ms = 6500) => {
    setSay(text)
    window.clearTimeout(sayTimer.current)
    sayTimer.current = window.setTimeout(() => setSay(null), ms)
  }, [])

  const wake = useCallback(() => {
    const c = ctl.current
    c.lastInteraction = Date.now()
    if (c.anim === 'sleep') {
      c.anim = 'idle'
      setSleeping(false)
    }
  }, [])

  const setAnim = useCallback((name: AnimName, oneshotMs = 0) => {
    const c = ctl.current
    c.anim = name
    c.frameIdx = 0
    c.frameAt = performance.now()
    c.animUntil = oneshotMs ? Date.now() + oneshotMs : 0
    setSleeping(name === 'sleep')
  }, [])

  const walkTo = useCallback((x: number) => {
    return new Promise<void>((resolve) => {
      const c = ctl.current
      const clamped = Math.min(window.innerWidth - W - EDGE, Math.max(EDGE, x))
      if (Math.abs(clamped - c.x) < 6 && c.yOff < 4) return resolve()
      c.target?.resolve()
      c.target = { x: clamped, resolve }
    })
  }, [])

  /* ---- main loop: movement, frames, ambient behavior ---- */
  useEffect(() => {
    const c = ctl.current
    const saved = useStore.getState()
    c.x = saved.companionX ?? Math.max(EDGE, window.innerWidth * 0.62)
    c.x = Math.min(window.innerWidth - W - EDGE, Math.max(EDGE, c.x))
    c.yOff = Math.min(Math.max(0, saved.companionY), window.innerHeight - H - 90)
    let raf = 0
    let last = performance.now()

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const wrap = wrapRef.current
      const canvas = canvasRef.current
      if (!wrap || !canvas) return

      // one-shot anim expiry
      if (c.animUntil && Date.now() > c.animUntil) {
        c.anim = c.target ? 'walk' : 'idle'
        c.animUntil = 0
      }

      // movement (paused while being dragged)
      if (c.target && !c.drag) {
        const dx = c.target.x - c.x
        const step = SPEED * dt
        c.facing = dx >= 0 ? 1 : -1
        if (c.anim !== 'walk' && !c.animUntil) setAnimRaw('walk')
        // climb back down to the ground while heading somewhere
        c.yOff = Math.max(0, c.yOff - SPEED * 1.4 * dt)
        if (Math.abs(dx) <= step && c.yOff === 0) {
          c.x = c.target.x
          const t = c.target
          c.target = null
          setAnimRaw('idle')
          useStore.getState().setCompanionPos(c.x, c.yOff)
          t.resolve()
        } else if (Math.abs(dx) > step) {
          c.x += Math.sign(dx) * step
        }
      }

      // ambient behavior (only when not running a command / chatting / held)
      const idleFor = Date.now() - c.lastInteraction
      if (!c.busy && !c.target && !c.animUntil && !c.drag) {
        const phase = useStore.getState().phase
        if (phase === 'focus' && idleFor > 75_000 && c.anim !== 'sleep') {
          setAnimRaw('sleep')
          setSleeping(true)
        }
        if (c.anim === 'idle') {
          if (Date.now() > c.nextBlink) {
            c.nextBlink = Date.now() + 2500 + Math.random() * 4500
            c.anim = 'blink'
            c.animUntil = Date.now() + 150
          } else if (
            Date.now() > c.nextWander &&
            c.yOff < 4 && // perched somewhere? stay put until dragged or commanded
            !useStore.getState().chatOpen
          ) {
            c.nextWander = Date.now() + 12_000 + Math.random() * 18_000
            const nx = EDGE + Math.random() * (window.innerWidth - W - EDGE * 2)
            void walkTo(nx)
          }
        }
        if (Date.now() > c.nextHydrate && c.anim !== 'sleep') {
          c.nextHydrate = Date.now() + 45 * 60_000
          speak('hydrate break 💧')
        }
      }

      // frame advance + draw
      const animDef = ANIMS[c.anim]
      if (now - c.frameAt > animDef.ms) {
        c.frameAt = now
        c.frameIdx = (c.frameIdx + 1) % animDef.frames.length
      }
      const key = `${c.anim}:${c.frameIdx % animDef.frames.length}:${c.facing}`
      if (key !== c.lastDrawnKey) {
        c.lastDrawnKey = key
        const ctx = canvas.getContext('2d')
        if (ctx) drawFrame(ctx, animDef.frames[c.frameIdx % animDef.frames.length], c.facing < 0)
      }
      // keep him on screen through orientation changes
      c.x = Math.min(window.innerWidth - W - EDGE, Math.max(EDGE, c.x))
      c.yOff = Math.min(window.innerHeight - H - 90, Math.max(0, c.yOff))
      wrap.style.transform = `translate3d(${c.x}px, ${-c.yOff}px, 0)`
    }

    const setAnimRaw = (name: AnimName) => {
      if (c.anim === name) return
      c.anim = name
      c.frameIdx = 0
      c.frameAt = performance.now()
      if (name !== 'sleep') setSleeping(false)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [speak, walkTo])

  /* ---- wake on any touch ---- */
  useEffect(() => {
    const onDown = () => wake()
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onDown)
  }, [wake])

  /* ---- timer events ---- */
  useEffect(() => {
    const onFocusDone = () => {
      wake()
      setAnim('happy', 2600)
      const n = useStore.getState().tallyCount
      speak(n > 1 ? `session ${n} done!! 🎉 breathe a little` : 'session done!! 🎉 break time')
    }
    const onBreakDone = () => {
      wake()
      speak('break’s over 🌱 one more round?')
    }
    window.addEventListener('medwork:focus-done', onFocusDone)
    window.addEventListener('medwork:break-done', onBreakDone)
    return () => {
      window.removeEventListener('medwork:focus-done', onFocusDone)
      window.removeEventListener('medwork:break-done', onBreakDone)
    }
  }, [setAnim, speak, wake])

  /* ---- command handling ---- */
  const dockX = (id: string) => {
    const el = document.querySelector(`[data-walk-target="${id}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return r.left + r.width / 2 - W / 2
  }

  const runIntents = useCallback(
    async (intents: ReturnType<typeof parseIntent>[]) => {
      const replies: string[] = []
      for (const intent of intents) {
        if (!intent) continue
        const step = intentToStep(intent)
        if (step.walk) {
          const x = dockX(step.walk)
          if (x != null) await walkTo(x)
          setAnim('tap', 620)
          await new Promise((r) => setTimeout(r, 620))
        }
        replies.push(step.run())
      }
      return replies
    },
    [setAnim, walkTo],
  )

  const processCommand = useCallback(
    async (text: string) => {
      const c = ctl.current
      if (c.busy) return
      c.busy = true
      wake()
      try {
        const intent = parseIntent(text)
        if (intent) {
          const replies = await runIntents([intent])
          speak(replies[replies.length - 1] ?? 'done!')
          return
        }
        if (!activeKey()) {
          speak(FALLBACK_REPLY, 9000)
          return
        }
        setThinking(true)
        const res = await askBrain(text)
        setThinking(false)
        if ('error' in res) {
          speak(BRAIN_ERRORS[res.error] ?? 'something went sideways 🌀', 9000)
          return
        }
        const replies = await runIntents(res.intents)
        speak(res.say || replies[replies.length - 1] || 'done!', 9000)
      } finally {
        setThinking(false)
        c.busy = false
      }
    },
    [runIntents, speak, wake],
  )

  const submit = () => {
    const t = input.trim()
    if (!t) return
    setInput('')
    void processCommand(t)
  }

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus()
  }, [chatOpen])

  return (
    <div ref={wrapRef} className="companion" data-testid="companion">
      {(say || thinking || chatOpen) && (
        <div className="companion__bubble glass" data-testid="bubble">
          {thinking ? (
            <div className="companion__dots" aria-label="thinking">
              <span />
              <span />
              <span />
            </div>
          ) : (
            say && <p className="companion__say">{say}</p>
          )}
          {chatOpen && (
            <form
              className="companion__form"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <input
                ref={inputRef}
                className="ginput companion__input"
                placeholder="tell pixel something…"
                value={input}
                data-testid="chat-input"
                enterKeyHint="send"
                onChange={(e) => setInput(e.target.value)}
              />
            </form>
          )}
        </div>
      )}
      {sleeping && (
        <div className="companion__zzz" aria-hidden>
          <span>z</span>
          <span>z</span>
          <span>z</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="companion__canvas"
        width={W}
        height={H}
        aria-label="pixel the crab"
        role="button"
        data-testid="companion-canvas"
        onPointerDown={(e) => {
          const c = ctl.current
          wake()
          e.currentTarget.setPointerCapture(e.pointerId)
          c.drag = { startX: e.clientX, startY: e.clientY, baseX: c.x, baseY: c.yOff, moved: false }
        }}
        onPointerMove={(e) => {
          const c = ctl.current
          const d = c.drag
          if (!d) return
          const dx = e.clientX - d.startX
          const dy = e.clientY - d.startY
          if (!d.moved && Math.hypot(dx, dy) > 8) {
            d.moved = true
            // picked up mid-errand? cancel the walk
            c.target?.resolve()
            c.target = null
            setAnim('held')
          }
          if (d.moved) {
            c.x = Math.min(window.innerWidth - W - EDGE, Math.max(EDGE, d.baseX + dx))
            c.yOff = Math.min(window.innerHeight - H - 90, Math.max(0, d.baseY - dy))
          }
        }}
        onPointerUp={(e) => {
          const c = ctl.current
          const d = c.drag
          c.drag = null
          if (!d) return
          e.currentTarget.releasePointerCapture(e.pointerId)
          if (d.moved) {
            setAnim(c.yOff > 4 ? 'idle' : 'happy', c.yOff > 4 ? 0 : 900)
            useStore.getState().setCompanionPos(c.x, c.yOff)
          } else {
            setChatOpen(!chatOpen)
          }
        }}
        onPointerCancel={() => {
          const c = ctl.current
          if (c.drag?.moved) useStore.getState().setCompanionPos(c.x, c.yOff)
          c.drag = null
          setAnim('idle')
        }}
      />
    </div>
  )
}
