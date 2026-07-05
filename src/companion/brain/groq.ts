import type { Intent } from '../actions'
import { useStore } from '../../state/store'
import { STATIONS } from '../../audio/stations'

/* Tier-2 brain: Groq (free tier, OpenAI-compatible, CORS-enabled).
   The model gets the same action set as the offline parser via tools. */

const MODEL = 'llama-3.3-70b-versatile'
const URL = 'https://api.groq.com/openai/v1/chat/completions'

interface ChatMsg {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

const history: ChatMsg[] = []

const TOOLS = [
  tool('set_timer', 'Start a focus timer for N minutes', {
    minutes: { type: 'number', description: 'duration in minutes' },
  }, ['minutes']),
  tool('pause_timer', 'Pause the running timer', {}),
  tool('resume_timer', 'Resume a paused timer', {}),
  tool('stop_timer', 'Stop/cancel the timer', {}),
  tool('add_task', 'Add a task to the study list', {
    text: { type: 'string' },
    time: { type: 'string', description: 'optional HH:MM 24h' },
  }, ['text']),
  tool('complete_task', 'Mark a task done by fuzzy text match', {
    query: { type: 'string' },
  }, ['query']),
  tool('play_music', 'Play a lofi radio station', {
    station: {
      type: 'string',
      description: `optional station hint, one of: ${STATIONS.map((s) => s.name).join(', ')}`,
    },
  }),
  tool('stop_music', 'Stop the radio', {}),
  tool('next_station', 'Switch to the next station', {}),
  tool('set_volume', 'Nudge volume', {
    direction: { type: 'string', enum: ['up', 'down'] },
  }, ['direction']),
  tool('change_scene', 'Cycle the background scene', {}),
  tool('set_dim', 'Dim or brighten the background', {
    direction: { type: 'string', enum: ['up', 'down'] },
  }, ['direction']),
]

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[] = [],
) {
  return {
    type: 'function' as const,
    function: {
      name,
      description,
      parameters: { type: 'object', properties, required },
    },
  }
}

function toolCallToIntent(tc: ToolCall): Intent | null {
  let args: Record<string, unknown> = {}
  try {
    args = JSON.parse(tc.function.arguments || '{}')
  } catch {
    /* malformed args — treat as no-arg call */
  }
  switch (tc.function.name) {
    case 'set_timer':
      return { type: 'set_timer', minutes: Number(args.minutes) || 25 }
    case 'pause_timer':
      return { type: 'pause_timer' }
    case 'resume_timer':
      return { type: 'resume_timer' }
    case 'stop_timer':
      return { type: 'stop_timer' }
    case 'add_task':
      return typeof args.text === 'string'
        ? { type: 'add_task', text: args.text, time: typeof args.time === 'string' ? args.time : undefined }
        : null
    case 'complete_task':
      return typeof args.query === 'string' ? { type: 'complete_task', query: args.query } : null
    case 'play_music':
      return { type: 'play_music', station: typeof args.station === 'string' ? args.station : undefined }
    case 'stop_music':
      return { type: 'stop_music' }
    case 'next_station':
      return { type: 'next_station' }
    case 'set_volume':
      return { type: 'set_volume', value: args.direction === 'down' ? 'down' : 'up' }
    case 'change_scene':
      return { type: 'change_scene' }
    case 'set_dim':
      return { type: 'set_dim', dir: args.direction === 'down' ? 'down' : 'up' }
    default:
      return null
  }
}

function systemPrompt() {
  const st = useStore.getState()
  const name = st.userName || 'doc'
  return `You are Pixel, a tiny pixel-art crab who lives inside "medwork", a cozy study app, keeping ${name} (a first-year med student) company.
Personality: warm, playful, encouraging, a little sleepy. Reply in lowercase, 1-2 short sentences max, occasional emoji. Never lecture.
When the user asks for an app action (timer, tasks, music, scene), call the matching tool. You can also answer quick study questions simply.
Current app state: timer ${st.phase}${st.phase !== 'idle' ? '' : ` (default ${st.focusMin}min)`}, ${st.tasks.filter((t) => !t.done).length} open tasks, music ${st.musicStatus}.`
}

export async function askGroq(
  userText: string,
): Promise<{ say: string; intents: Intent[] } | { error: string }> {
  const key = useStore.getState().groqKey
  if (!key) return { error: 'no-key' }

  history.push({ role: 'user', content: userText })
  while (history.length > 12) history.shift()

  const body = {
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt() }, ...history],
    tools: TOOLS,
    tool_choice: 'auto',
    max_tokens: 300,
    temperature: 0.7,
  }

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    })
    if (res.status === 401) return { error: 'bad-key' }
    if (!res.ok) return { error: `http-${res.status}` }
    const data = await res.json()
    const msg = data.choices?.[0]?.message
    if (!msg) return { error: 'empty' }

    const intents: Intent[] = []
    if (Array.isArray(msg.tool_calls)) {
      for (const tc of msg.tool_calls as ToolCall[]) {
        const intent = toolCallToIntent(tc)
        if (intent) intents.push(intent)
      }
    }
    const say: string = typeof msg.content === 'string' && msg.content.trim() ? msg.content.trim() : ''

    history.push({ role: 'assistant', content: say || '(did it)' })
    return { say, intents }
  } catch {
    return { error: 'network' }
  }
}
