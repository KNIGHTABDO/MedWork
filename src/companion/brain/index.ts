import { useStore } from '../../state/store'
import { askGroq, GROQ_DEFAULT_MODEL } from './groq'
import { askGemini, GEMINI_DEFAULT_MODEL } from './gemini'
import type { BrainResult } from './tools'

export function activeKey() {
  const st = useStore.getState()
  return st.provider === 'gemini' ? st.geminiKey : st.groqKey
}

export function defaultModelFor(provider: 'groq' | 'gemini') {
  return provider === 'gemini' ? GEMINI_DEFAULT_MODEL : GROQ_DEFAULT_MODEL
}

export async function askBrain(text: string): Promise<BrainResult> {
  return useStore.getState().provider === 'gemini' ? askGemini(text) : askGroq(text)
}
