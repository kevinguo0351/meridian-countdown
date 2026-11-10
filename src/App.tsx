import { useEffect, useRef, useState } from 'react'
import { Countdown } from './components/Countdown.tsx'
import { LockScreen } from './components/LockScreen.tsx'
import { MilestoneList } from './components/MilestoneList.tsx'
import { OsOverlay } from './components/OsOverlay.tsx'
import { SceneHost, type SceneController } from './components/SceneHost.tsx'
import { Studio } from './components/Studio.tsx'
import { downloadBlob, renderWallpaper, wallpaperName } from './export/wallpaper.ts'
import { loadState, shareableHref, writeStorage, writeUrl } from './lib/persist.ts'
import { applyToggle, canToggle, createPreset, type PresetId } from './lib/presets.ts'
import { horizonLabel } from './lib/time.ts'
import { useMedia, useNow } from './lib/useMedia.ts'
import { THEMES, type FrameMode, type LockState } from './types.ts'

export default function App() {
  const [state, setState] = useState<LockState>(() => loadState())
  const [overlay, setOverlay] = useState(true)
  const [bezel, setBezel] = useState(true)
  const [mode, setMode] = useState<FrameMode>('phone')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const now = useNow()
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const native = useMedia('(max-width: 820px)')
  const sceneRef = useRef<SceneController | null>(null)
  const doneKey = state.milestones.map((item) => (item.done ? '1' : '0')).join('')
  const themeHex = THEMES[state.theme].color

  useEffect(() => {
    writeStorage(state)
    writeUrl(state)
  }, [state])

  useEffect(() => {
    document.title = `${state.title} — Meridian`
  }, [state.title])

  const frame: FrameMode = native ? 'phone' : mode
  const accent = themeHex

  function onToggle(index: number) {
    if (!canToggle(state.milestones, index)) return
    const completing = !state.milestones[index].done
    sceneRef.current?.kick(completing ? 1 : 0.4)
    setState((current) => ({ ...current, milestones: applyToggle(current.milestones, index) }))
  }

  function onPreset(id: PresetId) {
    sceneRef.current?.kick(0.65)
    setState(createPreset(id))
  }

  async function onCopy() {
    writeUrl(state)
    const href = shareableHref()
    try {
      await navigator.clipboard.writeText(href)
    } catch {
      const area = document.createElement('textarea')
      area.value = href
      area.setAttribute('readonly', 'true')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function onExport() {
    const scene = sceneRef.current
    if (!scene || exporting) return
    setExporting(true)
    setExportError('')
    try {
      const snapshot = scene.capture()
      const blob = await renderWallpaper(snapshot, state, Date.now())
      downloadBlob(blob, wallpaperName(state.title))
    } catch (error) {
      console.error(error)
      setExportError('The wallpaper didn’t render. Try again in a moment.')
    } finally {
      setExporting(false)
    }
  }

  const screen = (
    <>
      <SceneHost
        target={state.target}
        doneKey={doneKey}
        count={state.milestones.length}
        themeHex={themeHex}
        reduced={reduced}
        sceneRef={sceneRef}
      />
      <div
        className="pointer-events-none absolute inset-x-[3%] z-[1]"
        style={{
          top: '30%',
          bottom: '13%',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background:
            'linear-gradient(to bottom, rgba(8,9,12,0.2) 0%, rgba(8,9,12,0.78) 12%, rgba(8,9,12,0.82) 48%, rgba(8,9,12,0.66) 84%, rgba(8,9,12,0) 100%)',
          maskImage: 'linear-gradient(to bottom, transparent, #000 5%, #000 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 5%, #000 92%, transparent)',
        }}
      />
      {overlay && <OsOverlay now={now} mode={frame} />}
      <div
        className="absolute z-10"
        style={{ top: '32%', right: 0, bottom: '16%', left: 0 }}
      >
        <div
          className={
            frame === 'desk'
              ? 'grid h-full w-full grid-cols-[1.12fr_0.88fr] items-center gap-[4cqw] overflow-y-auto px-[5%]'
              : 'h-full overflow-y-auto px-[7.5%] pt-[0.6cqh] pb-[0.4cqh]'
          }
        >
          <Countdown title={state.title} target={state.target} now={now} mode={frame} />
          <div className={frame === 'desk' ? '' : 'mt-[1.6cqh]'}>
            <MilestoneList milestones={state.milestones} mode={frame} onToggle={onToggle} />
          </div>
        </div>
      </div>
    </>
  )

  const studio = (
    <Studio
      state={state}
      onChange={setState}
      onPreset={onPreset}
      mode={mode}
      onMode={setMode}
      overlay={overlay}
      onOverlay={setOverlay}
      bezel={bezel}
      onBezel={setBezel}
      showBezel={!native}
      onExport={() => void onExport()}
      exporting={exporting}
      onCopy={() => void onCopy()}
      copied={copied}
      includeChrome
    />
  )

  return (
    <div
      className="relative min-h-dvh text-ivory"
      style={{
        background: `radial-gradient(ellipse 46% 58% at 50% 46%, color-mix(in srgb, ${accent} 20%, transparent), transparent 70%), #0b0c0e`,
        ['--accent' as string]: accent,
      }}
    >
      {native ? (
        <>
          <LockScreen
            mode="phone"
            bezel={false}
            native
            onPointerMove={(x, y) => sceneRef.current?.setPointer(x, y)}
            onPointerLeave={() => sceneRef.current?.setPointer(0, 0)}
          >
            {screen}
          </LockScreen>
          {!open && (
            <button
              type="button"
              data-testid="customize-toggle"
              onClick={() => setOpen(true)}
              className="fixed z-40 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 font-sans text-[11px] tracking-[0.18em] uppercase backdrop-blur-md"
              style={{ top: 'max(12px, env(safe-area-inset-top))', right: 14 }}
            >
              Edit
            </button>
          )}
          {open && (
            <div className="fixed inset-0 z-50 flex items-end bg-black/55" onClick={() => setOpen(false)}>
              <div
                className="glass max-h-[86dvh] w-full overflow-y-auto rounded-t-[1.6rem] px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-label="Customize Lock Screen"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-2xl italic">Customize Lock Screen</h2>
                  <button type="button" onClick={() => setOpen(false)} className="text-sm text-quiet">
                    Close
                  </button>
                </div>
                {studio}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="relative z-10 flex min-h-dvh flex-col">
          <header className="flex items-center justify-between gap-6 px-8 pt-5">
            <div className="flex items-baseline gap-4">
              <p className="font-sans text-[11px] font-medium tracking-[0.34em] text-[var(--accent)] uppercase">
                Meridian
              </p>
              <h1 className="font-serif text-lg italic text-ivory/90">
                A lock screen for one deadline.
              </h1>
            </div>
            <p className="hidden text-right font-sans text-sm text-quiet sm:block">
              <span className="text-ivory">{state.title}</span>
              <span className="mx-2 text-white/25">·</span>
              {horizonLabel(state.target, now)}
            </p>
          </header>

          <main className="flex flex-1 items-center justify-center px-4 py-4">
            <LockScreen
              mode={mode}
              bezel={bezel}
              native={false}
              onPointerMove={(x, y) => sceneRef.current?.setPointer(x, y)}
              onPointerLeave={() => sceneRef.current?.setPointer(0, 0)}
            >
              {screen}
            </LockScreen>
          </main>

          <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-3 px-6 pt-1 pb-6 text-[13px]">
            <div className="flex overflow-hidden rounded-full border border-white/15 text-[11px] font-medium tracking-[0.16em] uppercase" role="group" aria-label="Lock screen shape">
              <button
                type="button"
                data-testid="mode-phone"
                aria-pressed={mode === 'phone'}
                onClick={() => setMode('phone')}
                className={`px-3 py-2 ${mode === 'phone' ? 'ink-on-ivory' : 'text-[#f6f1e7]'}`}
              >
                Phone
              </button>
              <button
                type="button"
                data-testid="mode-desk"
                aria-pressed={mode === 'desk'}
                onClick={() => setMode('desk')}
                className={`px-3 py-2 ${mode === 'desk' ? 'ink-on-ivory' : 'text-[#f6f1e7]'}`}
              >
                Desk
              </button>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={overlay}
              data-testid="toggle-overlay"
              onClick={() => setOverlay((value) => !value)}
              className="rounded-full border border-white/10 px-3 py-2 text-ivory/90"
            >
              Show OS Lock Screen Overlay
              <span className="ml-2 text-[var(--accent)]">{overlay ? 'On' : 'Off'}</span>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={bezel}
              data-testid="toggle-bezel"
              onClick={() => setBezel((value) => !value)}
              className="rounded-full border border-white/10 px-3 py-2 text-ivory/90"
            >
              Device bezel
              <span className="ml-2 text-[var(--accent)]">{bezel ? 'On' : 'Off'}</span>
            </button>
            <button
              type="button"
              data-testid="customize-toggle"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="rounded-full border border-white/15 px-3 py-2 text-ivory"
            >
              Customize Lock Screen
            </button>
            <button
              type="button"
              data-testid="export-wallpaper"
              onClick={() => void onExport()}
              disabled={exporting}
              className="ink-on-ivory rounded-full px-3.5 py-2 font-medium"
            >
              {exporting ? 'Rendering…' : 'Download Lock Screen Wallpaper (PNG)'}
            </button>
            <button type="button" data-testid="copy-link" onClick={() => void onCopy()} className="rounded-full border border-white/15 px-3 py-2 text-ivory">
              {copied ? 'Link copied' : 'Copy Shareable Link'}
            </button>
          </footer>
          {exportError && (
            <p className="pb-4 text-center text-sm text-[#e08a62]" role="alert">
              {exportError}
            </p>
          )}

          {open && (
            <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
              <div
                className="glass max-h-[min(760px,86dvh)] w-full max-w-3xl overflow-y-auto rounded-3xl px-6 py-5"
                role="dialog"
                aria-label="Customize Lock Screen"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="font-serif text-3xl italic">Customize Lock Screen</h2>
                  <button type="button" onClick={() => setOpen(false)} className="text-sm tracking-[0.14em] text-quiet uppercase">
                    Close
                  </button>
                </div>
                <Studio
                  state={state}
                  onChange={setState}
                  onPreset={onPreset}
                  mode={mode}
                  onMode={setMode}
                  overlay={overlay}
                  onOverlay={setOverlay}
                  bezel={bezel}
                  onBezel={setBezel}
                  showBezel
                  onExport={() => void onExport()}
                  exporting={exporting}
                  onCopy={() => void onCopy()}
                  copied={copied}
                  includeChrome={false}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
