import { useEffect, useRef, useState } from 'react'
import { useStore, type CustomScene } from '../state/store'
import { BUILTIN_SCENES, deleteSceneBlob, loadSceneBlob, saveSceneBlob } from '../state/scenes'
import { Panel } from './Panel'
import { PlusIcon, TrashIcon } from './icons'

function CustomThumb({ scene }: { scene: CustomScene }) {
  const [url, setUrl] = useState<string | null>(scene.kind === 'url' ? (scene.url ?? null) : null)
  useEffect(() => {
    if (scene.kind !== 'blob') return
    let obj: string | null = null
    let cancelled = false
    void loadSceneBlob(scene.id).then((b) => {
      if (cancelled || !b) return
      obj = URL.createObjectURL(b)
      setUrl(obj)
    })
    return () => {
      cancelled = true
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [scene])
  return url ? <img src={url} alt="" draggable={false} /> : <span className="thumb__loading" />
}

export function ScenesPanel() {
  const sceneId = useStore((s) => s.sceneId)
  const customScenes = useStore((s) => s.customScenes)
  const setScene = useStore((s) => s.setScene)
  const addCustomScene = useStore((s) => s.addCustomScene)
  const removeCustomScene = useStore((s) => s.removeCustomScene)
  const dim = useStore((s) => s.dim)
  const setDim = useStore((s) => s.setDim)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const addUrl = () => {
    const u = urlInput.trim()
    if (!/^https?:\/\//i.test(u)) return
    const id = crypto.randomUUID()
    addCustomScene({ id, name: 'scene', kind: 'url', url: u })
    setScene(id)
    setUrlInput('')
  }

  const addFile = async (f: File) => {
    const id = crypto.randomUUID()
    await saveSceneBlob(id, f)
    addCustomScene({ id, name: f.name.replace(/\.\w+$/, '').slice(0, 24) || 'scene', kind: 'blob' })
    setScene(id)
  }

  const remove = (s: CustomScene) => {
    if (s.kind === 'blob') void deleteSceneBlob(s.id)
    removeCustomScene(s.id)
  }

  return (
    <Panel id="scenes" title="scenes" wide>
      <div className="scenegrid">
        {BUILTIN_SCENES.map((s) => (
          <button
            key={s.id}
            className={`thumb ${sceneId === s.id ? 'thumb--on' : ''}`}
            onClick={() => setScene(s.id)}
          >
            <img src={s.url} alt={s.name} draggable={false} />
            <span className="thumb__label">
              {s.name}
              {s.credit && <em> · {s.credit}</em>}
            </span>
          </button>
        ))}
        {customScenes.map((s) => (
          <div key={s.id} className={`thumb ${sceneId === s.id ? 'thumb--on' : ''}`}>
            <button className="thumb__pick" onClick={() => setScene(s.id)} aria-label={s.name}>
              <CustomThumb scene={s} />
            </button>
            <span className="thumb__label">{s.name}</span>
            <button className="thumb__del" aria-label="remove scene" onClick={() => remove(s)}>
              <TrashIcon size={14} />
            </button>
          </div>
        ))}
        <button className="thumb thumb--add" onClick={() => fileRef.current?.click()}>
          <PlusIcon size={26} />
          <span className="thumb__label">upload gif</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/gif,image/webp,image/png,image/jpeg"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void addFile(f)
          e.target.value = ''
        }}
      />

      <div className="scenerow">
        <input
          className="ginput"
          placeholder="…or paste a gif url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addUrl()}
        />
        <button className="glass glass-btn scenerow__go" aria-label="add scene url" onClick={addUrl}>
          <PlusIcon size={18} />
        </button>
      </div>

      <div className="dimrow">
        <span className="dimrow__label">dim</span>
        <input
          className="gslider"
          type="range"
          min="0"
          max="0.6"
          step="0.01"
          value={dim}
          aria-label="scene dimming"
          onChange={(e) => setDim(Number(e.target.value))}
        />
      </div>
    </Panel>
  )
}
