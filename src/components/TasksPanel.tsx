import { useState } from 'react'
import { useStore } from '../state/store'
import { Panel } from './Panel'
import { CheckIcon, PlusIcon, TrashIcon } from './icons'

export function TasksPanel() {
  const tasks = useStore((s) => s.tasks)
  const addTask = useStore((s) => s.addTask)
  const toggleTask = useStore((s) => s.toggleTask)
  const removeTask = useStore((s) => s.removeTask)
  const clearDone = useStore((s) => s.clearDone)
  const [text, setText] = useState('')
  const [time, setTime] = useState('')

  const submit = () => {
    if (!text.trim()) return
    addTask(text, time || undefined)
    setText('')
    setTime('')
  }

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (a.time && b.time) return a.time.localeCompare(b.time)
    if (a.time) return -1
    if (b.time) return 1
    return a.createdAt - b.createdAt
  })

  return (
    <Panel id="tasks" title="today">
      <div className="taskadd">
        <input
          className="ginput"
          placeholder="something to study…"
          value={text}
          data-testid="task-input"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <input
          className="ginput taskadd__time"
          type="time"
          value={time}
          aria-label="time (optional)"
          onChange={(e) => setTime(e.target.value)}
        />
        <button className="glass glass-btn taskadd__go" aria-label="add task" onClick={submit}>
          <PlusIcon size={18} />
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="panel__hint panel__hint--empty">nothing yet — a clear day ✨</p>
      ) : (
        <ul className="tasklist">
          {sorted.map((t) => (
            <li key={t.id} className={`task ${t.done ? 'task--done' : ''}`}>
              <button
                className={`task__check ${t.done ? 'task__check--on' : ''}`}
                aria-label={t.done ? 'mark undone' : 'mark done'}
                onClick={() => toggleTask(t.id)}
              >
                {t.done && <CheckIcon size={13} />}
              </button>
              <span className="task__text">{t.text}</span>
              {t.time && <span className="task__time">{t.time}</span>}
              <button className="task__del" aria-label="delete task" onClick={() => removeTask(t.id)}>
                <TrashIcon size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {tasks.some((t) => t.done) && (
        <button className="panel__linkbtn" onClick={clearDone}>
          clear finished
        </button>
      )}
    </Panel>
  )
}
