# medwork 🦀

a chill place to study — an iPad-first web app you add to your home screen.

a fullscreen pixel-art scene, liquid-glass widgets floating over it, lofi radio,
a focus timer, a tiny task list, and **pixel** — a little crab who lives on your
screen, naps while you study, and actually walks over to the timer when you tell
him *"set a 25 minute timer"*.

## get it on your ipad

1. enable github pages for this repo once: **settings → pages → source: github actions**
2. wait for the *deploy to github pages* action to finish
3. open `https://<your-username>.github.io/MedWork/` in safari
4. share button → **add to home screen** — done, it launches fullscreen like a native app

## pixel's brain

out of the box pixel understands things like:

- `set a 25 minute timer` · `pause` · `stop the timer`
- `add task: review anatomy at 6pm` · `done with anatomy`
- `play lofi` · `next station` · `quieter` · `stop the music`
- `change the scene` · `dim it a bit`

paste a free [groq](https://console.groq.com) api key in **settings** and pixel
gets a real brain — free chat, motivation, quick study questions, and smarter
command understanding. the key never leaves your device.

## develop

```bash
npm install
npm run dev        # local dev server
npm run build      # production build (tsc + vite)
node scripts/make-icons.mjs   # regenerate app icons
```

## notes

- everything is stored on-device (localStorage + IndexedDB). no server, no accounts.
- the default meadow scene is pixel art by [@anasabdin](https://twitter.com/anasabdin).
- radio stations are public internet streams (nightwave plaza, somafm…) and need a connection; everything else works offline.
