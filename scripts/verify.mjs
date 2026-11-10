import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'

const base = 'http://127.0.0.1:4731/'
const outDir = '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })
mkdirSync('/tmp/meridian', { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--disable-dev-shm-usage',
  ],
})

const context = await browser.newContext({
  viewport: { width: 1800, height: 1200 },
  deviceScaleFactor: 1,
})
await context.grantPermissions(['clipboard-read', 'clipboard-write'])
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForSelector('canvas')
await page.waitForTimeout(700)

const countdown = page.getByTestId('countdown')
await countdown.waitFor()
const opening = await countdown.innerText()
assert(opening.includes('Dream Offer Sprint'), 'default title missing')
assert(await page.getByTestId('os-overlay').isVisible(), 'overlay should be on')
assert(await page.getByTestId('device-bezel').isVisible(), 'bezel should be on')
const days = Number(await page.getByTestId('count-days').innerText())
assert(days >= 13 && days <= 14, `expected a live ~14 day countdown, got ${days}`)

await page.screenshot({ path: `${outDir}/cover.png` })
await page.screenshot({ path: '/tmp/meridian/cover-final.png' })

await page.getByTestId('milestone-current').click()
await page.waitForFunction(() => decodeURIComponent(location.search).includes('[1,"'))
const currentStep = await page.getByTestId('milestone-current').innerText()
assert(currentStep.includes('System design dry run'), `next milestone did not advance: ${currentStep}`)
assert(await page.getByTestId('milestone-undo').isVisible(), 'completed step should be undoable')

const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 20000 }),
  page.getByTestId('export-wallpaper').click(),
])
await download.saveAs(`${outDir}/wallpaper.png`)

const png = readFileSync(`${outDir}/wallpaper.png`)
const width = png.readUInt32BE(16)
const height = png.readUInt32BE(20)
assert(width === 1170 && height === 2532, `wallpaper is ${width}x${height}`)

await page.getByTestId('customize-toggle').click()
await page.getByRole('dialog', { name: 'Customize Lock Screen' }).waitFor()
await page.getByTestId('preset-thesis').click()
await page.waitForFunction(() => document.body.innerText.includes('Defense Week'))
assert((await countdown.innerText()).includes('Defense Week'), 'preset did not apply')
await page.getByTestId('theme-signal').click()
await page.waitForFunction(() => location.search.includes('theme=signal'))

const field = page.getByTestId('milestone-input-0')
await field.fill('x'.repeat(40))
const limited = await field.inputValue()
assert(limited.length === 32, `milestone limit failed: ${limited.length}`)

await page.getByRole('button', { name: 'Close' }).click()
await page.getByTestId('copy-link').click()
await page.getByText('Link copied').waitFor()
const copied = await page.evaluate(() => navigator.clipboard.readText())
assert(copied.includes('title='), 'share link missing title')
assert(copied.includes('theme=signal'), 'share link missing theme')
assert(copied.includes('target='), 'share link missing target')

await page.evaluate(() => {
  localStorage.setItem(
    'meridian-lock-v1',
    JSON.stringify({
      v: 1,
      title: 'FROM STORAGE',
      target: Date.now() + 86_400_000,
      theme: 'vellum',
      milestones: [{ id: 'stored', label: 'Stored step', done: false }],
    }),
  )
})
const target = new Date(Date.now() + 3 * 86_400_000).toISOString()
const milestones = encodeURIComponent(JSON.stringify([[0, 'URL step']]))
await page.goto(
  `${base}?title=From%20The%20URL&target=${encodeURIComponent(target)}&theme=aureole&m=${milestones}`,
  { waitUntil: 'networkidle' },
)
const fromUrl = await page.getByTestId('countdown').innerText()
assert(fromUrl.includes('From The URL'), 'URL did not override storage')
assert(!fromUrl.includes('FROM STORAGE'), 'storage leaked over the URL')
assert(fromUrl.includes('URL step') || (await page.locator('body').innerText()).includes('URL step'), 'URL milestone missing')

await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(300)
assert(await page.getByTestId('customize-toggle').isVisible(), 'mobile edit control missing')
assert(await page.getByTestId('os-overlay').isVisible(), 'mobile overlay missing')
await page.screenshot({ path: '/tmp/meridian/mobile-final.png' })

await page.emulateMedia({ reducedMotion: 'reduce' })
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('canvas')
await page.getByTestId('mode-desk').click()
await page.waitForTimeout(400)
const mode = await page.getByTestId('lock-screen').getAttribute('data-mode')
assert(mode === 'desk', `expected desk mode, got ${mode}`)

assert(errors.length === 0, `console errors:\n${errors.join('\n')}`)
console.log('verify ok', { width, height, days })
await browser.close()
