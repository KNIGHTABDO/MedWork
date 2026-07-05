// End-to-end smoke test: drives the built app at iPad viewports.
// Usage: npm run build && npm run preview & node scripts/verify.mjs
// Env: PW_EXECUTABLE (chromium binary), BASE_URL, SHOTS_DIR
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/MedWork/'
const OUT = process.env.SHOTS_DIR ?? 'shots'
mkdirSync(OUT, { recursive: true })

const results = []
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
}

const browser = await chromium.launch(
  process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {},
)
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } })
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message))

// mock the AI provider APIs (offline-safe, deterministic)
const geminiReply = {
  candidates: [
    {
      content: {
        role: 'model',
        parts: [{ text: 'on it! locking you in 🌱' }, { functionCall: { name: 'set_timer', args: { minutes: 7 } } }],
      },
    },
  ],
}
await page.route('**/generativelanguage.googleapis.com/v1beta/models?*', (route) =>
  route.fulfill({
    json: {
      models: [
        { name: 'models/gemini-3-pro-preview', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-2.5-flash-image', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent'] },
      ],
    },
  }),
)
await page.route('**/generativelanguage.googleapis.com/v1beta/models/*%3AgenerateContent*', (r) =>
  r.fulfill({ json: geminiReply }),
)
await page.route('**/generativelanguage.googleapis.com/v1beta/models/*:generateContent*', (r) =>
  r.fulfill({ json: geminiReply }),
)

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/01-home-landscape.png` })

check('clock visible', await page.getByTestId('clock').isVisible())
check('companion visible', await page.getByTestId('companion').isVisible())

await page.getByTestId('dock-timer').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/02-timer-panel.png` })
await page.getByTestId('start-focus').click()
await page.waitForTimeout(900)
const remaining = await page.getByTestId('remaining').textContent()
check('timer started at 25:xx', /^2[45]:/.test(remaining ?? ''), remaining ?? 'none')
await page.screenshot({ path: `${OUT}/03-timer-running.png` })

await page.locator('.focal__ctl').first().click()
await page.waitForTimeout(300)
await page.locator('.focal__ctl').nth(1).click()
await page.waitForTimeout(400)
check('timer stopped (clock back)', await page.getByTestId('clock').isVisible())

await page.getByTestId('dock-tasks').click()
await page.waitForTimeout(600)
await page.getByTestId('task-input').fill('review anatomy notes')
await page.getByTestId('task-input').press('Enter')
await page.waitForTimeout(300)
check('task added', (await page.locator('.task__text').first().textContent()) === 'review anatomy notes')
await page.screenshot({ path: `${OUT}/04-tasks.png` })
await page.locator('.task__check').first().click()
await page.waitForTimeout(400)
check('task completed', (await page.locator('.task--done').count()) === 1)

await page.getByTestId('dock-music').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/05-music.png` })
check('stations listed', (await page.locator('.station').count()) >= 5)

await page.getByTestId('dock-scenes').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/06-scenes.png` })

await page.getByTestId('dock-settings').click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/07-settings.png` })

// --- brain picker: switch to gemini, fetch models, choose one ---
await page.getByTestId('provider-gemini').click()
await page.getByTestId('brain-key').fill('AIza-test-key')
await page.getByTestId('model-pick').click()
await page.waitForTimeout(700)
const listText = (await page.getByTestId('model-list').textContent()) ?? ''
check('gemini models fetched', listText.includes('gemini-3-pro-preview'), listText.slice(0, 120))
check('non-chat models filtered out', !listText.includes('embedding') && !listText.includes('image'))
await page.screenshot({ path: `${OUT}/12-model-picker.png` })
await page.locator('.modelitem', { hasText: 'gemini-3-pro-preview' }).click()
await page.waitForTimeout(300)
const pickText = (await page.getByTestId('model-pick').textContent()) ?? ''
check('model selected', pickText.includes('gemini-3-pro-preview'), pickText)

await page.getByTestId('dock-settings').click()
await page.waitForTimeout(500)

await page.locator('.companion__canvas').click()
await page.waitForTimeout(400)
check('chat opens', await page.getByTestId('chat-input').isVisible())
await page.getByTestId('chat-input').fill('set a 5 minute timer')
await page.getByTestId('chat-input').press('Enter')
await page.waitForTimeout(3500)
const rem2 = await page.getByTestId('remaining').textContent().catch(() => null)
check('companion set 5 min timer', /^[45]:/.test(rem2 ?? ''), rem2 ?? 'none')
await page.screenshot({ path: `${OUT}/08-companion-command.png` })
const bubble = await page.getByTestId('bubble').textContent().catch(() => '')
check('companion replied', /minutes on the clock/.test(bubble ?? ''), bubble ?? '')

await page.getByTestId('chat-input').fill('add task: pharmacology flashcards at 6pm')
await page.getByTestId('chat-input').press('Enter')
await page.waitForTimeout(3000)
const taskTexts = await page.locator('.task__text').allTextContents()
check('companion added task', taskTexts.some((t) => t.includes('pharmacology flashcards')), taskTexts.join('|'))
await page.screenshot({ path: `${OUT}/09-companion-task.png` })

// --- gemini brain: free-form phrase the offline parser can't handle ---
await page.getByTestId('chat-input').fill('hmm i wanna lock in for a lil bit, you decide')
await page.getByTestId('chat-input').press('Enter')
await page.waitForTimeout(4000)
const remG = await page.getByTestId('remaining').textContent().catch(() => null)
check('gemini tool call set 7 min timer', /^[67]:/.test(remG ?? ''), remG ?? 'none')
const bubbleG = await page.getByTestId('bubble').textContent().catch(() => '')
check('gemini reply shown', /locking you in/.test(bubbleG ?? ''), bubbleG ?? '')

// --- drag & drop the companion ---
const crab = page.getByTestId('companion-canvas')
let box = await crab.boundingBox()
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2) // close the open chat
await page.waitForTimeout(300)
const before = await page.getByTestId('companion').evaluate((el) => el.style.transform)
box = await crab.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x - 200, box.y - 300, { steps: 12 })
await page.waitForTimeout(220) // settle so the release reads as a gentle drop, not a throw
await page.mouse.up()
await page.waitForTimeout(400)
const after = await page.getByTestId('companion').evaluate((el) => el.style.transform)
const m = after.match(/translate3d\(([\d.-]+)px, ([\d.-]+)px/)
check('companion dragged up-left', m != null && Number(m[2]) < -250 && after !== before, after)
await page.screenshot({ path: `${OUT}/11-companion-dragged.png` })
// perched: should stay put (no wander pulls him down immediately)
await page.waitForTimeout(1200)
const still = await page.getByTestId('companion').evaluate((el) => el.style.transform)
check('companion stays where dropped', still === after, still)
// tap (no movement) still opens chat
box = await crab.boundingBox()
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
await page.waitForTimeout(400)
check('tap after drag still opens chat', await page.getByTestId('chat-input').isVisible())

// --- throw him: fast flick → physics → dizzy landing ---
box = await crab.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(box.x + 320, box.y - 160, { steps: 4 })
await page.mouse.up()
const sawDizzy = await page
  .waitForFunction(() => document.querySelector('[data-testid="companion-canvas"]')?.dataset.anim === 'dizzy', null, { timeout: 6000 })
  .then(() => true)
  .catch(() => false)
check('throw triggers dizzy landing', sawDizzy)
await page.screenshot({ path: `${OUT}/13-tossed.png` })
await page.waitForTimeout(2200)
const landed = await page.getByTestId('companion').evaluate((el) => el.style.transform)
check('lands back on the ground', /px,\s*0px,\s*0(px)?\)/.test(landed), landed)

// carry him to the corner so he doesn't block the tasks panel
box = await crab.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await page.mouse.move(70, 820 - 50, { steps: 10 })
await page.waitForTimeout(220)
await page.mouse.up()
await page.waitForTimeout(300)

// --- manual task check-off gets a cheer ---
if (!(await page.getByTestId('panel-tasks').isVisible().catch(() => false))) {
  await page.getByTestId('dock-tasks').click()
  await page.waitForTimeout(600)
}
await page.locator('.task:not(.task--done) .task__check').first().click()
await page.waitForTimeout(600)
const cheer = (await page.getByTestId('bubble').textContent().catch(() => '')) ?? ''
check('task check-off cheer', /nice one|one down|look at you/.test(cheer), cheer)
await page.getByTestId('dock-tasks').click()
await page.waitForTimeout(400)

await page.setViewportSize({ width: 820, height: 1180 })
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/10-portrait.png` })

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const rem3 = await page.getByTestId('remaining').textContent().catch(() => null)
check('timer survives reload', rem3 != null, rem3 ?? 'none')

const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]')
  if (!link) return null
  const r = await fetch(link.href)
  return r.ok ? r.json() : null
})
check('manifest served', manifest?.display === 'standalone')

console.log('\n' + results.join('\n'))
await browser.close()
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0)
