import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore, type PanelId } from '../state/store'
import { XIcon } from './icons'

/* Glass sheet that floats above the dock. Mount/unmount with a soft
   scale+fade so nothing ever snaps. */
export function Panel({
  id,
  title,
  children,
  wide,
}: {
  id: Exclude<PanelId, null>
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const panel = useStore((s) => s.panel)
  const setPanel = useStore((s) => s.setPanel)
  const open = panel === id
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const closeTimer = useRef<number>(undefined)

  useEffect(() => {
    if (open) {
      window.clearTimeout(closeTimer.current)
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      closeTimer.current = window.setTimeout(() => setMounted(false), 380)
    }
    return () => window.clearTimeout(closeTimer.current)
  }, [open])

  if (!mounted) return null

  return (
    <section
      className={`panel glass glass--strong ${wide ? 'panel--wide' : ''} ${visible ? 'panel--in' : ''}`}
      data-testid={`panel-${id}`}
      aria-label={title}
    >
      <header className="panel__head">
        <h2 className="panel__title">{title}</h2>
        <button className="glass-btn panel__close" aria-label="close" onClick={() => setPanel(null)}>
          <XIcon size={16} />
        </button>
      </header>
      <div className="panel__body">{children}</div>
    </section>
  )
}
