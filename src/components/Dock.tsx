import { useStore, type PanelId } from '../state/store'
import { GearIcon, MusicIcon, SceneIcon, TasksIcon, TimerIcon } from './icons'

const ITEMS: { id: Exclude<PanelId, null>; label: string; icon: React.ReactNode }[] = [
  { id: 'timer', label: 'timer', icon: <TimerIcon /> },
  { id: 'tasks', label: 'tasks', icon: <TasksIcon /> },
  { id: 'music', label: 'music', icon: <MusicIcon /> },
  { id: 'scenes', label: 'scenes', icon: <SceneIcon /> },
  { id: 'settings', label: 'settings', icon: <GearIcon /> },
]

export function Dock() {
  const panel = useStore((s) => s.panel)
  const togglePanel = useStore((s) => s.togglePanel)

  return (
    <nav className="dock glass glass--strong" aria-label="dock">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          data-walk-target={it.id}
          data-testid={`dock-${it.id}`}
          className={`glass-btn dock__btn ${panel === it.id ? 'glass-btn--on' : ''}`}
          aria-label={it.label}
          onClick={() => togglePanel(it.id)}
        >
          {it.icon}
        </button>
      ))}
    </nav>
  )
}
