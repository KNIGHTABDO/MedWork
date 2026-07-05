import { SceneLayer } from './components/SceneLayer'
import { TopPill } from './components/TopPill'
import { FocalClock } from './components/FocalClock'
import { Dock } from './components/Dock'
import { TimerPanel } from './components/TimerPanel'
import { TasksPanel } from './components/TasksPanel'
import { MusicPanel } from './components/MusicPanel'
import { ScenesPanel } from './components/ScenesPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { Companion } from './companion/Companion'
import { useWakeLock } from './state/hooks'

export default function App() {
  useWakeLock()
  return (
    <>
      <SceneLayer />
      <TopPill />
      <FocalClock />
      <TimerPanel />
      <TasksPanel />
      <MusicPanel />
      <ScenesPanel />
      <SettingsPanel />
      <Dock />
      <Companion />
    </>
  )
}
