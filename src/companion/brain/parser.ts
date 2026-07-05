import type { Intent } from '../actions'

/* Tier-1 brain: offline intent parsing. Understands the everyday phrases
   so pixel works with no key and no internet. */

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

const HELLOS = [
  'hey hey 👋 ready when you are',
  'hi! shall we set a timer?',
  'hello doc 🩺 what are we studying today?',
]
const THANKS = ['anytime 🧡', 'that’s what i’m here for', 'of course!']
const MOTIVATION = [
  'one page at a time — you’ve got this 🌱',
  'future-you is already grateful. 25 minutes?',
  'deep breath. small step. big brain 🧠',
  'anatomy fears you, honestly',
]

export function parseIntent(raw: string): Intent | null {
  const text = raw.trim().toLowerCase()

  // ---- timer ----
  const mins = text.match(/(\d+)\s*(?:h(?:ours?)?|hrs?)?\s*(?:min(?:ute)?s?|m\b)?/)
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h(?:ours?)?|hrs?)\b/)
  const minMatch = text.match(/(\d+)\s*(?:min(?:ute)?s?|m\b)/)
  const timerWords = /(timer|focus|pomodoro|session|study|work|countdown)/.test(text)

  if (/(pause|hold)\b/.test(text) && /(timer|session|focus|it)?/.test(text) && !/music/.test(text))
    if (/(timer|session|focus)/.test(text) || text === 'pause') return { type: 'pause_timer' }
  if (/\b(resume|continue|unpause)\b/.test(text) && !/music/.test(text))
    return { type: 'resume_timer' }
  if (/\b(stop|cancel|end|reset)\b/.test(text) && /(timer|session|focus|pomodoro)/.test(text))
    return { type: 'stop_timer' }

  if (timerWords || /\bset\b.*\b(min|hour)/.test(text)) {
    if (hourMatch) return { type: 'set_timer', minutes: Math.round(parseFloat(hourMatch[1]) * 60) }
    if (minMatch) return { type: 'set_timer', minutes: parseInt(minMatch[1], 10) }
    if (/(start|begin|go|let'?s)/.test(text)) return { type: 'start_timer' }
    if (mins && /^\d+$/.test(text)) return { type: 'set_timer', minutes: parseInt(text, 10) }
  }

  // ---- tasks ----
  const addMatch = text.match(
    /(?:add(?:\s+a)?\s+task[:\s]+|task[:\s]+|remind me to\s+|i (?:need|have) to\s+|todo[:\s]+)(.+)/,
  )
  if (addMatch) {
    let body = addMatch[1].trim()
    let time: string | undefined
    const at = body.match(/\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
    if (at) {
      let h = parseInt(at[1], 10)
      if (at[3] === 'pm' && h < 12) h += 12
      if (at[3] === 'am' && h === 12) h = 0
      time = `${String(h).padStart(2, '0')}:${at[2] ?? '00'}`
      body = body.slice(0, at.index).trim()
    }
    if (body) return { type: 'add_task', text: body, time }
  }
  const doneMatch = text.match(
    /(?:(?:i(?:'m| am)?\s+)?(?:done|finished)(?:\s+with)?|complete|check off|tick off)\s+(.+)/,
  )
  if (doneMatch && !/timer|session|music/.test(doneMatch[1]))
    return { type: 'complete_task', query: doneMatch[1].trim() }

  // ---- music ----
  if (/(stop|pause|kill|turn off|mute)\b.*\b(music|radio|song|audio)/.test(text))
    return { type: 'stop_music' }
  if (/(next|skip|change|another)\b.*\b(station|song|music|track)/.test(text))
    return { type: 'next_station' }
  if (/\b(louder|volume up|turn (it |the volume )?up)\b/.test(text))
    return { type: 'set_volume', value: 'up' }
  if (/\b(quieter|softer|lower|volume down|turn (it |the volume )?down)\b/.test(text))
    return { type: 'set_volume', value: 'down' }
  const playMatch = text.match(/play\s+(?:some\s+|the\s+)?(.*)/)
  if (playMatch !== null || /(music|radio) on/.test(text)) {
    const what = playMatch?.[1]?.replace(/\b(music|radio|please|station)\b/g, '').trim()
    return { type: 'play_music', station: what || undefined }
  }

  // ---- scene ----
  if (/(change|switch|next|new)\b.*\b(scene|background|view|wallpaper|gif)/.test(text))
    return { type: 'change_scene' }
  if (/\b(dim|darker|too bright)\b/.test(text)) return { type: 'set_dim', dir: 'up' }
  if (/\b(brighter|too dark|undim|lighten)\b/.test(text)) return { type: 'set_dim', dir: 'down' }

  // ---- open panels ----
  const openMatch = text.match(/(?:open|show|go to)\s+(?:the\s+)?(timer|tasks?|music|scenes?|settings)/)
  if (openMatch) {
    const p = openMatch[1].replace(/s?$/, 's')
    const panel = (
      { timers: 'timer', tasks: 'tasks', musics: 'music', scenes: 'scenes', settingss: 'settings' } as const
    )[p]
    if (panel) return { type: 'open_panel', panel }
  }

  // ---- small talk ----
  if (/^(hi|hey|hello|yo|sup|hiya)\b/.test(text)) return { type: 'chat', reply: pick(HELLOS) }
  if (/(thank|thanks|thx|ty)\b/.test(text)) return { type: 'chat', reply: pick(THANKS) }
  if (/(motivat|tired|can'?t|exhausted|lazy|hard|give up|help me)/.test(text))
    return { type: 'chat', reply: pick(MOTIVATION) }
  if (/(who are you|what are you|your name)/.test(text))
    return { type: 'chat', reply: 'i’m pixel 🦀 your study buddy. try “set a 25 minute timer”' }

  return null
}

export const FALLBACK_REPLY =
  'hmm, i didn’t catch that 🦀 try “set a 25 min timer”, “play lofi”, or “add task: review anatomy” — or give me a groq key in settings and i get much smarter'
