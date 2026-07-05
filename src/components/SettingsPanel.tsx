import { useStore } from '../state/store'
import { Panel } from './Panel'

export function SettingsPanel() {
  const userName = useStore((s) => s.userName)
  const setUserName = useStore((s) => s.setUserName)
  const use24h = useStore((s) => s.use24h)
  const setUse24h = useStore((s) => s.setUse24h)
  const groqKey = useStore((s) => s.groqKey)
  const setGroqKey = useStore((s) => s.setGroqKey)

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

      <label className="setting">
        <span className="setting__label">groq api key — gives pixel a real brain 🧠</span>
        <input
          className="ginput"
          type="password"
          placeholder="gsk_…"
          value={groqKey}
          autoComplete="off"
          data-testid="groq-key"
          onChange={(e) => setGroqKey(e.target.value)}
        />
        <span className="setting__hint">
          free at console.groq.com — stored only on this device. without a key, pixel still
          understands simple commands offline.
        </span>
      </label>
    </Panel>
  )
}
