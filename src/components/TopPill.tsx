import { useNow } from '../state/hooks'
import { useStore } from '../state/store'

function greeting(h: number, name: string) {
  const who = name ? `, ${name}` : ', doc'
  if (h < 5) return `late night${who} 🌙`
  if (h < 12) return `good morning${who} ☀️`
  if (h < 17) return `good afternoon${who} 🌤`
  if (h < 21) return `good evening${who} 🌆`
  return `good night${who} 🌙`
}

export function TopPill() {
  const now = useNow()
  const userName = useStore((s) => s.userName)
  const date = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="toppill glass glass--pill">
      <span className="toppill__greet">{greeting(now.getHours(), userName)}</span>
      <span className="toppill__dot">·</span>
      <span className="toppill__date">{date.toLowerCase()}</span>
    </div>
  )
}
