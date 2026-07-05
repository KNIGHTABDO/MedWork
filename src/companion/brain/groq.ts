import { useStore } from '../../state/store'
import { argsToIntent, openAiTools, systemPrompt, type BrainResult } from './tools'
import type { Intent } from '../actions'

/* Groq brain: free tier, OpenAI-compatible, CORS-enabled. */

export const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile'
const URL = 'https://api.groq.com/openai/v1/chat/completions'

interface ChatMsg {
  role: 'system' | 'user' | 'assistant'
  content: string | null
}

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

const history: ChatMsg[] = []

export async function askGroq(userText: string): Promise<BrainResult> {
  const st = useStore.getState()
  const key = st.groqKey
  if (!key) return { error: 'no-key' }
  const model = st.groqModel !== 'auto' ? st.groqModel : GROQ_DEFAULT_MODEL

  history.push({ role: 'user', content: userText })
  while (history.length > 12) history.shift()

  const body = {
    model,
    messages: [{ role: 'system', content: systemPrompt() }, ...history],
    tools: openAiTools(),
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
    if (res.status === 401 || res.status === 403) return { error: 'bad-key' }
    if (res.status === 404) return { error: 'bad-model' }
    if (!res.ok) return { error: `http-${res.status}` }
    const data = await res.json()
    const msg = data.choices?.[0]?.message
    if (!msg) return { error: 'empty' }

    const intents: Intent[] = []
    if (Array.isArray(msg.tool_calls)) {
      for (const tc of msg.tool_calls as ToolCall[]) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.function.arguments || '{}')
        } catch {
          /* malformed args — treat as no-arg call */
        }
        const intent = argsToIntent(tc.function.name, args)
        if (intent) intents.push(intent)
      }
    }
    const say: string =
      typeof msg.content === 'string' && msg.content.trim() ? msg.content.trim() : ''

    history.push({ role: 'assistant', content: say || '(did it)' })
    return { say, intents }
  } catch {
    return { error: 'network' }
  }
}
