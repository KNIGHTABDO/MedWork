export interface Station {
  id: string
  name: string
  mood: string
  url: string
}

/* Long-running public radio streams. Playback needs internet;
   the player shows a soft error and lets you hop stations if one is down. */
export const STATIONS: Station[] = [
  {
    id: 'plaza',
    name: 'Nightwave Plaza',
    mood: 'vaporwave · late night',
    url: 'https://radio.plaza.one/mp3',
  },
  {
    id: 'groovesalad',
    name: 'Groove Salad',
    mood: 'ambient beats · classic chill',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
  },
  {
    id: 'fluid',
    name: 'Fluid',
    mood: 'instrumental hiphop · mellow',
    url: 'https://ice1.somafm.com/fluid-128-mp3',
  },
  {
    id: 'dronezone',
    name: 'Drone Zone',
    mood: 'deep ambient · space',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
  },
  {
    id: 'vaporwaves',
    name: 'Vaporwaves',
    mood: 'vaporwave · dreamy',
    url: 'https://ice1.somafm.com/vaporwaves-128-mp3',
  },
  {
    id: 'lofi-laut',
    name: 'lofi.fm',
    mood: 'lofi hiphop · study',
    url: 'https://stream.laut.fm/lofi',
  },
]

export const stationById = (id: string) => STATIONS.find((s) => s.id === id) ?? STATIONS[0]
