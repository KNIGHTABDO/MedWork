import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PanelId = 'timer' | 'tasks' | 'music' | 'scenes' | 'settings' | null
export type TimerPhase = 'idle' | 'focus' | 'break'

export interface Task {
  id: string
  text: string
  time?: string
  done: boolean
  createdAt: number
}

export interface CustomScene {
  id: string
  name: string
  kind: 'url' | 'blob'
  url?: string
}

export type MusicStatus = 'idle' | 'loading' | 'playing' | 'error'

const todayKey = () => new Date().toISOString().slice(0, 10)

export interface AppState {
  // ---- ui ----
  panel: PanelId
  setPanel: (p: PanelId) => void
  togglePanel: (p: Exclude<PanelId, null>) => void

  // ---- scene ----
  sceneId: string
  customScenes: CustomScene[]
  dim: number
  setScene: (id: string) => void
  addCustomScene: (s: CustomScene) => void
  removeCustomScene: (id: string) => void
  setDim: (d: number) => void

  // ---- timer ----
  focusMin: number
  breakMin: number
  phase: TimerPhase
  endsAt: number | null
  pausedRemaining: number | null
  phaseDurationSec: number
  tallyDate: string
  tallyCount: number
  setDurations: (focus: number, brk: number) => void
  startFocus: (minutes?: number) => void
  startBreak: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  finishFocus: () => void

  // ---- tasks ----
  tasks: Task[]
  addTask: (text: string, time?: string) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  clearDone: () => void

  // ---- music ----
  stationId: string
  volume: number
  musicStatus: MusicStatus
  setStation: (id: string) => void
  setVolume: (v: number) => void
  setMusicStatus: (s: MusicStatus) => void

  // ---- settings ----
  groqKey: string
  userName: string
  use24h: boolean
  setGroqKey: (k: string) => void
  setUserName: (n: string) => void
  setUse24h: (v: boolean) => void

  // ---- companion ----
  chatOpen: boolean
  setChatOpen: (v: boolean) => void
  companionX: number | null
  companionY: number
  setCompanionPos: (x: number, y: number) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---- ui ----
      panel: null,
      setPanel: (p) => set({ panel: p }),
      togglePanel: (p) => set({ panel: get().panel === p ? null : p }),

      // ---- scene ----
      sceneId: 'meadow',
      customScenes: [],
      dim: 0.18,
      setScene: (id) => set({ sceneId: id }),
      addCustomScene: (s) => set({ customScenes: [...get().customScenes, s] }),
      removeCustomScene: (id) =>
        set((st) => ({
          customScenes: st.customScenes.filter((s) => s.id !== id),
          sceneId: st.sceneId === id ? 'meadow' : st.sceneId,
        })),
      setDim: (d) => set({ dim: Math.min(0.6, Math.max(0, d)) }),

      // ---- timer ----
      focusMin: 25,
      breakMin: 5,
      phase: 'idle',
      endsAt: null,
      pausedRemaining: null,
      phaseDurationSec: 25 * 60,
      tallyDate: todayKey(),
      tallyCount: 0,
      setDurations: (focus, brk) =>
        set({
          focusMin: Math.min(180, Math.max(1, Math.round(focus))),
          breakMin: Math.min(60, Math.max(1, Math.round(brk))),
        }),
      startFocus: (minutes) => {
        const mins = minutes ? Math.min(180, Math.max(1, Math.round(minutes))) : get().focusMin
        set({
          focusMin: mins,
          phase: 'focus',
          phaseDurationSec: mins * 60,
          endsAt: Date.now() + mins * 60_000,
          pausedRemaining: null,
        })
      },
      startBreak: () => {
        const mins = get().breakMin
        set({
          phase: 'break',
          phaseDurationSec: mins * 60,
          endsAt: Date.now() + mins * 60_000,
          pausedRemaining: null,
        })
      },
      pauseTimer: () => {
        const { endsAt } = get()
        if (!endsAt) return
        set({
          pausedRemaining: Math.max(0, Math.round((endsAt - Date.now()) / 1000)),
          endsAt: null,
        })
      },
      resumeTimer: () => {
        const { pausedRemaining } = get()
        if (pausedRemaining == null) return
        set({ endsAt: Date.now() + pausedRemaining * 1000, pausedRemaining: null })
      },
      stopTimer: () => set({ phase: 'idle', endsAt: null, pausedRemaining: null }),
      finishFocus: () => {
        const today = todayKey()
        const st = get()
        set({
          tallyDate: today,
          tallyCount: st.tallyDate === today ? st.tallyCount + 1 : 1,
        })
      },

      // ---- tasks ----
      tasks: [],
      addTask: (text, time) =>
        set((st) => ({
          tasks: [
            ...st.tasks,
            {
              id: crypto.randomUUID(),
              text: text.trim(),
              time,
              done: false,
              createdAt: Date.now(),
            },
          ],
        })),
      toggleTask: (id) =>
        set((st) => ({
          tasks: st.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      removeTask: (id) => set((st) => ({ tasks: st.tasks.filter((t) => t.id !== id) })),
      clearDone: () => set((st) => ({ tasks: st.tasks.filter((t) => !t.done) })),

      // ---- music ----
      stationId: 'plaza',
      volume: 0.7,
      musicStatus: 'idle',
      setStation: (id) => set({ stationId: id }),
      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      setMusicStatus: (s) => set({ musicStatus: s }),

      // ---- settings ----
      groqKey: '',
      userName: '',
      use24h: false,
      setGroqKey: (k) => set({ groqKey: k.trim() }),
      setUserName: (n) => set({ userName: n.trim() }),
      setUse24h: (v) => set({ use24h: v }),

      // ---- companion ----
      chatOpen: false,
      setChatOpen: (v) => set({ chatOpen: v }),
      companionX: null,
      companionY: 0,
      setCompanionPos: (x, y) => set({ companionX: x, companionY: y }),
    }),
    {
      name: 'medwork',
      partialize: (st) => ({
        sceneId: st.sceneId,
        customScenes: st.customScenes,
        dim: st.dim,
        focusMin: st.focusMin,
        breakMin: st.breakMin,
        phase: st.phase,
        endsAt: st.endsAt,
        pausedRemaining: st.pausedRemaining,
        phaseDurationSec: st.phaseDurationSec,
        tallyDate: st.tallyDate,
        tallyCount: st.tallyCount,
        tasks: st.tasks,
        stationId: st.stationId,
        volume: st.volume,
        groqKey: st.groqKey,
        userName: st.userName,
        use24h: st.use24h,
        companionX: st.companionX,
        companionY: st.companionY,
      }),
    },
  ),
)
