import { useState } from 'react'
import { useStore } from '../state/store'
import { Panel } from './Panel'
import { PlayIcon } from './icons'

const PRESETS = [
  { label: '25 · 5', focus: 25, brk: 5 },
  { label: '50 · 10', focus: 50, brk: 10 },
  { label: '90 · 15', focus: 90, brk: 15 },
]

export function TimerPanel() {
  const focusMin = useStore((s) => s.focusMin)
  const breakMin = useStore((s) => s.breakMin)
  const setDurations = useStore((s) => s.setDurations)
  const startFocus = useStore((s) => s.startFocus)
  const setPanel = useStore((s) => s.setPanel)
  const phase = useStore((s) => s.phase)
  const [custom, setCustom] = useState('')

  const begin = (mins?: number) => {
    startFocus(mins)
    setPanel(null)
  }

  return (
    <Panel id="timer" title="focus timer">
      <div className="presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`glass glass-btn preset ${focusMin === p.focus && breakMin === p.brk ? 'glass-btn--on' : ''}`}
            onClick={() => setDurations(p.focus, p.brk)}
          >
            <span className="preset__big">{p.focus}</span>
            <span className="preset__small">+{p.brk} break</span>
          </button>
        ))}
      </div>

      <div className="timerrow">
        <input
          className="ginput timerrow__input"
          inputMode="numeric"
          placeholder="custom minutes…"
          value={custom}
          data-testid="custom-minutes"
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && custom) begin(Number(custom))
          }}
        />
        <button
          className="glass glass-btn timerrow__go"
          data-testid="start-focus"
          aria-label="start focus"
          onClick={() => begin(custom ? Number(custom) : undefined)}
        >
          <PlayIcon size={18} />
          <span>{phase === 'idle' ? 'begin' : 'restart'}</span>
        </button>
      </div>

      <p className="panel__hint">
        {focusMin} min focus · {breakMin} min break · your screen stays awake
      </p>
    </Panel>
  )
}
