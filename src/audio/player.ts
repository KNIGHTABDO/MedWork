import { useStore } from '../state/store'
import { stationById } from './stations'

/* One global <audio> element, outside React, so playback survives re-renders. */
let audio: HTMLAudioElement | null = null

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'none'
  audio.crossOrigin = 'anonymous'
  audio.addEventListener('playing', () => useStore.getState().setMusicStatus('playing'))
  audio.addEventListener('waiting', () => useStore.getState().setMusicStatus('loading'))
  audio.addEventListener('error', () => useStore.getState().setMusicStatus('error'))
  audio.addEventListener('stalled', () => useStore.getState().setMusicStatus('loading'))
  return audio
}

export function playStation(id?: string) {
  const st = useStore.getState()
  const station = stationById(id ?? st.stationId)
  if (id && id !== st.stationId) st.setStation(station.id)
  const a = ensureAudio()
  st.setMusicStatus('loading')
  a.src = station.url
  a.volume = st.volume
  a.play().catch(() => st.setMusicStatus('error'))

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: 'medwork radio',
      album: station.mood,
    })
    navigator.mediaSession.setActionHandler('play', () => playStation())
    navigator.mediaSession.setActionHandler('pause', () => stopMusic())
  }
}

export function stopMusic() {
  const a = ensureAudio()
  a.pause()
  a.removeAttribute('src')
  a.load()
  useStore.getState().setMusicStatus('idle')
}

export function setPlayerVolume(v: number) {
  useStore.getState().setVolume(v)
  if (audio) audio.volume = Math.min(1, Math.max(0, v))
}

export function isPlaying() {
  const s = useStore.getState().musicStatus
  return s === 'playing' || s === 'loading'
}
