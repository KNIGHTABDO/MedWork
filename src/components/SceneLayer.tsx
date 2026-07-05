import { useEffect, useState } from 'react'
import { useStore } from '../state/store'
import { BUILTIN_SCENES, loadSceneBlob } from '../state/scenes'

export function SceneLayer() {
  const sceneId = useStore((s) => s.sceneId)
  const customScenes = useStore((s) => s.customScenes)
  const dim = useStore((s) => s.dim)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    const builtin = BUILTIN_SCENES.find((s) => s.id === sceneId)
    if (builtin) {
      setUrl(builtin.url)
      return
    }
    const custom = customScenes.find((s) => s.id === sceneId)
    if (!custom) {
      setUrl(BUILTIN_SCENES[0].url)
      return
    }
    if (custom.kind === 'url' && custom.url) {
      setUrl(custom.url)
      return
    }
    void loadSceneBlob(custom.id).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sceneId, customScenes])

  return (
    <div className="scene" aria-hidden>
      {url && <img className="scene__img" src={url} alt="" draggable={false} />}
      <div className="scene__dim" style={{ opacity: dim }} />
      <div className="scene__vignette" />
    </div>
  )
}
