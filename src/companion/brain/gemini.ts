import { useStore } from '../../state/store'
import { argsToIntent, geminiTools, systemPrompt, type BrainResult } from './tools'
import type { Intent } from '../actions'

/* Gemini brain: Google Generative Language API (free tier, CORS-enabled). */

export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash'
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

interface GeminiPart {
  text?: string
  functionCall?: { name: string; args?: Record<string, unknown> }
}

interface GeminiTurn {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

const history: GeminiTurn[] = []

export async function askGemini(userText: string): Promise<BrainResult> {
  const st = useStore.getState()
  const key = st.geminiKey
  if (!key) return { error: 'no-key' }
  const model = st.geminiModel !== 'auto' ? st.geminiModel : GEMINI_DEFAULT_MODEL

  history.push({ role: 'user', parts: [{ text: userText }] })
  while (history.length > 12) history.shift()

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt() }] },
    contents: history,
    tools: geminiTools(),
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  }

  try {
    const res = await fetch(
      `${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const err = await res.json().catch(() => null)
      const msg: string = err?.error?.message ?? ''
      if (/api key|permission|credential/i.test(msg) || res.status !== 400) return { error: 'bad-key' }
      return { error: 'bad-model' }
    }
    if (res.status === 404) return { error: 'bad-model' }
    if (res.status === 429) return { error: 'rate-limit' }
    if (!res.ok) return { error: `http-${res.status}` }

    const data = await res.json()
    const parts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? []
    if (parts.length === 0) return { error: 'empty' }

    const intents: Intent[] = []
    let say = ''
    for (const p of parts) {
      if (p.functionCall) {
        const intent = argsToIntent(p.functionCall.name, p.functionCall.args ?? {})
        if (intent) intents.push(intent)
      }
      if (typeof p.text === 'string') say += p.text
    }
    say = say.trim()

    // keep only plain text in history — replaying a functionCall turn
    // without its functionResponse makes the next request invalid
    history.push({ role: 'model', parts: [{ text: say || '(did it)' }] })
    return { say, intents }
  } catch {
    return { error: 'network' }
  }
}
