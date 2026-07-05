import { useStore } from '../state/store'
import { STATIONS } from '../audio/stations'
import { playStation, setPlayerVolume, stopMusic } from '../audio/player'
import { Panel } from './Panel'
import { PauseIcon, PlayIcon } from './icons'

export function MusicPanel() {
  const stationId = useStore((s) => s.stationId)
  const volume = useStore((s) => s.volume)
  const status = useStore((s) => s.musicStatus)
  const active = status === 'playing' || status === 'loading'

  return (
    <Panel id="music" title="radio">
      <ul className="stations">
        {STATIONS.map((st) => {
          const current = st.id === stationId
          return (
            <li key={st.id}>
              <button
                className={`station ${current ? 'station--on' : ''}`}
                data-testid={`station-${st.id}`}
                onClick={() => playStation(st.id)}
              >
                <span className={`station__dot ${current && active ? 'station__dot--live' : ''}`} />
                <span className="station__name">{st.name}</span>
                <span className="station__mood">{st.mood}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {status === 'error' && (
        <p className="panel__hint panel__hint--warn">can’t reach this station — try another 🌧</p>
      )}

      <div className="musicctl">
        <button
          className="glass glass-btn musicctl__play"
          aria-label={active ? 'pause radio' : 'play radio'}
          data-testid="music-toggle"
          onClick={() => (active ? stopMusic() : playStation())}
        >
          {active ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
        </button>
        <input
          className="gslider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          aria-label="volume"
          onChange={(e) => setPlayerVolume(Number(e.target.value))}
        />
      </div>
    </Panel>
  )
}
