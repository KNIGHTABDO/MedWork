import { openDB, type IDBPDatabase } from 'idb'
import meadowGif from '../assets/scenes/meadow.gif'

export interface BuiltinScene {
  id: string
  name: string
  credit?: string
  url: string
}

export const BUILTIN_SCENES: BuiltinScene[] = [
  { id: 'meadow', name: 'meadow', credit: 'art by @anasabdin', url: meadowGif },
]

let dbPromise: Promise<IDBPDatabase> | null = null

function db() {
  dbPromise ??= openDB('medwork-scenes', 1, {
    upgrade(d) {
      d.createObjectStore('gifs')
    },
  })
  return dbPromise
}

export async function saveSceneBlob(id: string, blob: Blob) {
  await (await db()).put('gifs', blob, id)
}

export async function loadSceneBlob(id: string): Promise<Blob | undefined> {
  return (await db()).get('gifs', id)
}

export async function deleteSceneBlob(id: string) {
  await (await db()).delete('gifs', id)
}
