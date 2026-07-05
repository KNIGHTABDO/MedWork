import type { Intent } from '../actions'
import { useStore } from '../../state/store'
import { STATIONS } from '../../audio/stations'

/* One tool catalogue shared by every provider; each brain converts it
   to its own wire format. */

interface ToolSpec {
  name: string
  description: string
  properties: Record<string, { type: string; description?: string; enum?: string[] }>
  required: string[]
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'set_timer',
    description: 'Start a focus timer for N minutes',
    properties: { minutes: { type: 'number', description: 'duration in minutes' } },
    required: ['minutes'],
  },
  { name: 'pause_timer', description: 'Pause the running timer', properties: {}, required: [] },
  { name: 'resume_timer', description: 'Resume a paused timer', properties: {}, required: [] },
  { name: 'stop_timer', description: 'Stop/cancel the timer', properties: {}, required: [] },
  {
    name: 'add_task',
    description: 'Add a task to the study list',
    properties: {
      text: { type: 'string' },
      time: { type: 'string', description: 'optional HH:MM 24h' },
    },
    required: ['text'],
  },
  {
    name: 'complete_task',
    description: 'Mark a task done by fuzzy text match',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
  {
    name: 'play_music',
    description: 'Play a lofi radio station',
    properties: {
      station: {
        type: 'string',
        description: `optional station hint, one of: ${STATIONS.map((s) => s.name).join(', ')}`,
      },
    },
    required: [],
  },
  { name: 'stop_music', description: 'Stop the radio', properties: {}, required: [] },
  { name: 'next_station', description: 'Switch to the next station', properties: {}, required: [] },
  {
    name: 'set_volume',
    description: 'Nudge volume',
    properties: { direction: { type: 'string', enum: ['up', 'down'] } },
    required: ['direction'],
  },
  { name: 'change_scene', description: 'Cycle the background scene', properties: {}, required: [] },
  {
    name: 'set_dim',
    description: 'Dim or brighten the background',
    properties: { direction: { type: 'string', enum: ['up', 'down'] } },
    required: ['direction'],
  },
]

export function openAiTools() {
  return TOOL_SPECS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: { type: 'object', properties: t.properties, required: t.required },
    },
  }))
}

export function geminiTools() {
  return [
    {
      functionDeclarations: TOOL_SPECS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: 'OBJECT',
          properties: Object.fromEntries(
            Object.entries(t.properties).map(([k, v]) => [
              k,
              { ...v, type: v.type.toUpperCase() },
            ]),
          ),
          required: t.required,
        },
      })),
    },
  ]
}

export function argsToIntent(name: string, args: Record<string, unknown>): Intent | null {
  switch (name) {
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
        ? {
            type: 'add_task',
            text: args.text,
            time: typeof args.time === 'string' ? args.time : undefined,
          }
        : null
    case 'complete_task':
      return typeof args.query === 'string' ? { type: 'complete_task', query: args.query } : null
    case 'play_music':
      return {
        type: 'play_music',
        station: typeof args.station === 'string' ? args.station : undefined,
      }
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

export function systemPrompt() {
  const st = useStore.getState()
  const name = st.userName || 'doc'
  return `You are Pixel, a tiny pixel-art crab who lives inside "medwork", a cozy study app, keeping ${name} (a first-year med student) company.
Personality: warm, playful, encouraging, a little sleepy. Reply in lowercase, 1-2 short sentences max, occasional emoji. Never lecture.
When the user asks for an app action (timer, tasks, music, scene), call the matching tool. You can also answer quick study questions simply.
Current app state: timer ${st.phase}${st.phase !== 'idle' ? '' : ` (default ${st.focusMin}min)`}, ${st.tasks.filter((t) => !t.done).length} open tasks, music ${st.musicStatus}.`
}

export type BrainResult = { say: string; intents: Intent[] } | { error: string }
