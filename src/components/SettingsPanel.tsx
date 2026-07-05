import { useState } from 'react'
import { useStore } from '../state/store'
import { Panel } from './Panel'
import { defaultModelFor } from '../companion/brain'
import { fetchModels, type ModelInfo } from '../companion/brain/models'
import { CheckIcon } from './icons'

const KEY_HINTS = {
  groq: { placeholder: 'gsk_…', site: 'console.groq.com' },
  gemini: { placeholder: 'AIza…', site: 'aistudio.google.com' },
} as const

function BrainPicker() {
  const provider = useStore((s) => s.provider)
  const setProvider = useStore((s) => s.setProvider)
  const groqKey = useStore((s) => s.groqKey)
  const geminiKey = useStore((s) => s.geminiKey)
  const setGroqKey = useStore((s) => s.setGroqKey)
  const setGeminiKey = useStore((s) => s.setGeminiKey)
  const groqModel = useStore((s) => s.groqModel)
  const geminiModel = useStore((s) => s.geminiModel)
  const setModel = useStore((s) => s.setModel)

  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  const key = provider === 'gemini' ? geminiKey : groqKey
  const model = provider === 'gemini' ? geminiModel : groqModel

  const pickProvider = (p: 'groq' | 'gemini') => {
    if (p === provider) return
    setProvider(p)
    setOpen(false)
    setModels(null)
    setState('idle')
  }

  const toggleList = async () => {
    if (open) return setOpen(false)
    setOpen(true)
    if (!key || models) return
    setState('loading')
    const r = await fetchModels(provider, key)
    if (Array.isArray(r)) {
      setModels(r)
      setState('idle')
    } else {
      setState('error')
    }
  }

  const choose = (id: string) => {
    setModel(provider, id)
    setOpen(false)
  }

  return (
    <div className="setting">
      <span className="setting__label">pixel’s brain 🧠</span>

      <div className="seg" role="tablist" aria-label="ai provider">
        <button
          role="tab"
          aria-selected={provider === 'groq'}
          data-testid="provider-groq"
          className={`seg__opt ${provider === 'groq' ? 'seg__opt--on' : ''}`}
          onClick={() => pickProvider('groq')}
        >
          groq
        </button>
        <button
          role="tab"
          aria-selected={provider === 'gemini'}
          data-testid="provider-gemini"
          className={`seg__opt ${provider === 'gemini' ? 'seg__opt--on' : ''}`}
          onClick={() => pickProvider('gemini')}
        >
          gemini
        </button>
      </div>

      <input
        className="ginput"
        type="password"
        placeholder={KEY_HINTS[provider].placeholder}
        value={key}
        autoComplete="off"
        data-testid="brain-key"
        onChange={(e) => {
          ;(provider === 'gemini' ? setGeminiKey : setGroqKey)(e.target.value)
          setModels(null)
        }}
      />

      <button className="modelpick" data-testid="model-pick" onClick={() => void toggleList()}>
        <span className="modelpick__label">model</span>
        <span className="modelpick__cur">
          {model === 'auto' ? `auto · ${defaultModelFor(provider)}` : model}
        </span>
        <span className={`modelpick__chev ${open ? 'modelpick__chev--up' : ''}`} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="modellist" data-testid="model-list">
          {!key ? (
            <p className="modellist__note">add your {provider} key first, then i’ll fetch the latest models ✨</p>
          ) : state === 'loading' ? (
            <p className="modellist__note">fetching the latest models…</p>
          ) : state === 'error' ? (
            <p className="modellist__note">couldn’t fetch models — check the key or your connection 🌧</p>
          ) : (
            <>
              <button
                className={`modelitem ${model === 'auto' ? 'modelitem--on' : ''}`}
                onClick={() => choose('auto')}
              >
                <span className="modelitem__name">auto</span>
                <span className="modelitem__hint">{defaultModelFor(provider)} · recommended</span>
                {model === 'auto' && <CheckIcon size={14} />}
              </button>
              {(models ?? []).map((m) => (
                <button
                  key={m.id}
                  className={`modelitem ${model === m.id ? 'modelitem--on' : ''}`}
                  onClick={() => choose(m.id)}
                >
                  <span className="modelitem__name">{m.label}</span>
                  {model === m.id && <CheckIcon size={14} />}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <span className="setting__hint">
        free key at {KEY_HINTS[provider].site} — stored only on this device. without a key, pixel
        still understands simple commands offline.
      </span>
    </div>
  )
}

export function SettingsPanel() {
  const userName = useStore((s) => s.userName)
  const setUserName = useStore((s) => s.setUserName)
  const use24h = useStore((s) => s.use24h)
  const setUse24h = useStore((s) => s.setUse24h)

  return (
    <Panel id="settings" title="settings">
      <label className="setting">
        <span className="setting__label">what should pixel call you?</span>
        <input
          className="ginput"
          placeholder="doc"
          value={userName}
          maxLength={20}
          onChange={(e) => setUserName(e.target.value)}
        />
      </label>

      <label className="setting setting--row">
        <span className="setting__label">24-hour clock</span>
        <button
          role="switch"
          aria-checked={use24h}
          className={`gswitch ${use24h ? 'gswitch--on' : ''}`}
          onClick={() => setUse24h(!use24h)}
        >
          <span className="gswitch__knob" />
        </button>
      </label>

      <div className="hairline" />

      <BrainPicker />
    </Panel>
  )
}
