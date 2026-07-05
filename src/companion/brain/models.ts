/* Live model catalogues, fetched from each provider so the list is
   always current without shipping app updates. */

export interface ModelInfo {
  id: string
  label: string
}

const NOT_A_CHAT_MODEL = /whisper|tts|audio|embed|guard|moderation|allam|aqa|image|imagen|veo|live|vision-latest|robotics/i

export async function fetchModels(
  provider: 'groq' | 'gemini',
  key: string,
): Promise<ModelInfo[] | { error: string }> {
  try {
    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (res.status === 401 || res.status === 403) return { error: 'bad-key' }
      if (!res.ok) return { error: `http-${res.status}` }
      const data = await res.json()
      const models: ModelInfo[] = (data.data ?? [])
        .map((m: { id: string }) => m.id)
        .filter((id: string) => id && !NOT_A_CHAT_MODEL.test(id))
        .sort()
        .map((id: string) => ({ id, label: id }))
      return models
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(key)}`,
    )
    if (res.status === 400 || res.status === 401 || res.status === 403) return { error: 'bad-key' }
    if (!res.ok) return { error: `http-${res.status}` }
    const data = await res.json()
    interface GModel {
      name?: string
      displayName?: string
      supportedGenerationMethods?: string[]
    }
    const models: ModelInfo[] = ((data.models ?? []) as GModel[])
      .filter(
        (m) =>
          m.name?.startsWith('models/gemini') &&
          m.supportedGenerationMethods?.includes('generateContent') &&
          !NOT_A_CHAT_MODEL.test(m.name),
      )
      .map((m) => ({ id: m.name!.replace(/^models\//, ''), label: m.name!.replace(/^models\//, '') }))
      // newest families first (gemini-3 > gemini-2.5 > …)
      .sort((a, b) => b.id.localeCompare(a.id))
    return models
  } catch {
    return { error: 'network' }
  }
}
