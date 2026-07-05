import { useNow, useTimerTick } from '../state/hooks'
import { useStore } from '../state/store'
import { PauseIcon, PlayIcon, StopIcon } from './icons'

function fmtClock(d: Date, use24h: boolean) {
  let h = d.getHours()
  if (!use24h) h = h % 12 || 12
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtRemaining(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const R = 128
const CIRC = 2 * Math.PI * R

export function FocalClock() {
  const now = useNow()
  const use24h = useStore((s) => s.use24h)
  const phase = useStore((s) => s.phase)
  const paused = useStore((s) => s.pausedRemaining) != null
  const duration = useStore((s) => s.phaseDurationSec)
  const tallyCount = useStore((s) => s.tallyCount)
  const tallyDate = useStore((s) => s.tallyDate)
  const pauseTimer = useStore((s) => s.pauseTimer)
  const resumeTimer = useStore((s) => s.resumeTimer)
  const stopTimer = useStore((s) => s.stopTimer)
  const remaining = useTimerTick()

  const today = new Date().toISOString().slice(0, 10)
  const dots = tallyDate === today ? Math.min(tallyCount, 8) : 0

  if (phase === 'idle') {
    return (
      <div className="focal">
        <div className="focal__time" data-testid="clock">
          {fmtClock(now, use24h)}
        </div>
        {dots > 0 && (
          <div className="focal__tally" title={`${tallyCount} focus sessions today`}>
            {Array.from({ length: dots }, (_, i) => (
              <span key={i} className="focal__dot" />
            ))}
          </div>
        )}
      </div>
    )
  }

  const progress = duration > 0 ? remaining / duration : 0

  return (
    <div className={`focal focal--running focal--${phase}`}>
      <div className="focal__ringwrap">
        <svg className="focal__ring" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd9a0" />
              <stop offset="100%" stopColor="#ff9d6e" />
            </linearGradient>
            <linearGradient id="ringGradBreak" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a8e6d5" />
              <stop offset="100%" stopColor="#7ec8f0" />
            </linearGradient>
          </defs>
          <circle className="focal__ring-track" cx="150" cy="150" r={R} />
          <circle
            className="focal__ring-fill"
            cx="150"
            cy="150"
            r={R}
            stroke={phase === 'focus' ? 'url(#ringGrad)' : 'url(#ringGradBreak)'}
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            transform="rotate(-90 150 150)"
          />
        </svg>
        <div className="focal__center">
          <div className="focal__phase">{phase === 'focus' ? 'focus' : 'breathe'}</div>
          <div className="focal__remaining" data-testid="remaining">
            {fmtRemaining(remaining)}
          </div>
          {phase === 'break' && <div className="focal__breath" aria-hidden />}
        </div>
      </div>
      <div className="focal__controls">
        <button
          className="glass glass-btn focal__ctl"
          aria-label={paused ? 'resume' : 'pause'}
          onClick={() => (paused ? resumeTimer() : pauseTimer())}
        >
          {paused ? <PlayIcon size={20} /> : <PauseIcon size={20} />}
        </button>
        <button className="glass glass-btn focal__ctl" aria-label="stop" onClick={stopTimer}>
          <StopIcon size={20} />
        </button>
      </div>
    </div>
  )
}
