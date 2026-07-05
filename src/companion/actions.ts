import { useStore } from '../state/store'
import { STATIONS, stationById } from '../audio/stations'
import { BUILTIN_SCENES } from '../state/scenes'
import { playStation, setPlayerVolume, stopMusic } from '../audio/player'

export type Intent =
  | { type: 'set_timer'; minutes: number }
  | { type: 'start_timer' }
  | { type: 'pause_timer' }
  | { type: 'resume_timer' }
  | { type: 'stop_timer' }
  | { type: 'add_task'; text: string; time?: string }
  | { type: 'complete_task'; query: string }
  | { type: 'play_music'; station?: string }
  | { type: 'stop_music' }
  | { type: 'next_station' }
  | { type: 'set_volume'; value: number | 'up' | 'down' }
  | { type: 'change_scene' }
  | { type: 'set_dim'; dir: 'up' | 'down' }
  | { type: 'open_panel'; panel: 'timer' | 'tasks' | 'music' | 'scenes' | 'settings' }
  | { type: 'chat'; reply: string }

export interface Step {
  /* dock button the sprite walks to before acting (data-walk-target) */
  walk?: string
  /* perform the action; returns what pixel says afterwards */
  run: () => string
}

function findStation(q?: string) {
  if (!q) return undefined
  const needle = q.toLowerCase()
  return STATIONS.find(
    (s) => s.name.toLowerCase().includes(needle) || s.mood.toLowerCase().includes(needle),
  )
}

export function intentToStep(intent: Intent): Step {
  const st = () => useStore.getState()
  switch (intent.type) {
    case 'set_timer': {
      const m = Math.min(180, Math.max(1, Math.round(intent.minutes)))
      return {
        walk: 'timer',
        run: () => {
          st().startFocus(m)
          return `${m} minutes on the clock — let's go 🔥`
        },
      }
    }
    case 'start_timer':
      return {
        walk: 'timer',
        run: () => {
          st().startFocus()
          return `${st().focusMin} minutes of focus, starting now ✨`
        },
      }
    case 'pause_timer':
      return {
        walk: 'timer',
        run: () => {
          if (st().phase === 'idle') return 'nothing running right now'
          st().pauseTimer()
          return 'paused — breathe'
        },
      }
    case 'resume_timer':
      return {
        walk: 'timer',
        run: () => {
          st().resumeTimer()
          return 'back at it 💪'
        },
      }
    case 'stop_timer':
      return {
        walk: 'timer',
        run: () => {
          st().stopTimer()
          return 'timer cleared'
        },
      }
    case 'add_task':
      return {
        walk: 'tasks',
        run: () => {
          st().addTask(intent.text, intent.time)
          st().setPanel('tasks')
          return `added “${intent.text}” 📝`
        },
      }
    case 'complete_task':
      return {
        walk: 'tasks',
        run: () => {
          const q = intent.query.toLowerCase()
          const task = st().tasks.find((t) => !t.done && t.text.toLowerCase().includes(q))
          if (!task) return `hmm, couldn't find a task like “${intent.query}”`
          st().toggleTask(task.id)
          st().setPanel('tasks')
          return `“${task.text}” — done ✅ nice`
        },
      }
    case 'play_music': {
      const station = findStation(intent.station)
      return {
        walk: 'music',
        run: () => {
          playStation(station?.id)
          const s = station ?? stationById(st().stationId)
          return `tuning into ${s.name} 🎧`
        },
      }
    }
    case 'stop_music':
      return {
        walk: 'music',
        run: () => {
          stopMusic()
          return 'music off 🤫'
        },
      }
    case 'next_station':
      return {
        walk: 'music',
        run: () => {
          const i = STATIONS.findIndex((s) => s.id === st().stationId)
          const next = STATIONS[(i + 1) % STATIONS.length]
          playStation(next.id)
          return `switching to ${next.name} 🎶`
        },
      }
    case 'set_volume':
      return {
        walk: 'music',
        run: () => {
          const v = st().volume
          const nv =
            intent.value === 'up'
              ? v + 0.15
              : intent.value === 'down'
                ? v - 0.15
                : intent.value
          setPlayerVolume(nv)
          return intent.value === 'up' ? 'a little louder 🔊' : 'a little softer 🔉'
        },
      }
    case 'change_scene':
      return {
        walk: 'scenes',
        run: () => {
          const all = [...BUILTIN_SCENES.map((s) => s.id), ...st().customScenes.map((s) => s.id)]
          if (all.length < 2) {
            st().setPanel('scenes')
            return 'only one scene so far — add more gifs here 🖼'
          }
          const i = all.indexOf(st().sceneId)
          st().setScene(all[(i + 1) % all.length])
          return 'new view 🏞'
        },
      }
    case 'set_dim':
      return {
        walk: 'scenes',
        run: () => {
          const d = st().dim
          st().setDim(intent.dir === 'up' ? d + 0.12 : d - 0.12)
          return intent.dir === 'up' ? 'dimmed it a bit 🌒' : 'brighter ☀️'
        },
      }
    case 'open_panel':
      return {
        walk: intent.panel,
        run: () => {
          st().setPanel(intent.panel)
          return 'here you go'
        },
      }
    case 'chat':
      return { run: () => intent.reply }
  }
}
