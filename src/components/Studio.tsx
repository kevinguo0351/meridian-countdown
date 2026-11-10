import { Plus, X } from 'lucide-react'
import { PRESETS, normalize, uid, type PresetId } from '../lib/presets.ts'
import { toDatetimeLocal } from '../lib/time.ts'
import {
  MAX_MILESTONES,
  MILESTONE_LIMIT,
  THEMES,
  TITLE_LIMIT,
  type FrameMode,
  type LockState,
  type ThemeId,
} from '../types.ts'

type StudioProps = {
  state: LockState
  onChange: (state: LockState) => void
  onPreset: (id: PresetId) => void
  mode: FrameMode
  onMode: (mode: FrameMode) => void
  overlay: boolean
  onOverlay: (value: boolean) => void
  bezel: boolean
  onBezel: (value: boolean) => void
  showBezel: boolean
  onExport: () => void
  exporting: boolean
  onCopy: () => void
  copied: boolean
  includeChrome: boolean
}

function Switch({
  checked,
  label,
  testId,
  onChange,
}: {
  checked: boolean
  label: string
  testId: string
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left"
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-[var(--accent)]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[#14120e] transition ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
      <span className="text-sm text-ivory">{label}</span>
    </button>
  )
}

export function Studio({
  state,
  onChange,
  onPreset,
  mode,
  onMode,
  overlay,
  onOverlay,
  bezel,
  onBezel,
  showBezel,
  onExport,
  exporting,
  onCopy,
  copied,
  includeChrome,
}: StudioProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-relaxed text-quiet">
        The light stays cool while the runway is long, and warms as the hour nears. Check the
        milestone marked next up — a ring aligns and the crystal rises.
      </p>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-sans text-[11px] font-medium tracking-[0.18em] text-quiet uppercase">
          Presets
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRESETS.map((preset) => {
            const active = state.title === preset.title && state.theme === preset.theme
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`preset-${preset.id}`}
                aria-pressed={active}
                onClick={() => onPreset(preset.id)}
                className={`rounded-2xl border px-3 py-3 text-left ${
                  active
                    ? 'border-[var(--accent)] bg-white/[0.05]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <span className="block text-sm font-medium text-ivory">{preset.name}</span>
                <span className="mt-1 block text-xs text-quiet">
                  {preset.title} · {preset.days} days · {THEMES[preset.theme].label}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-[11px] tracking-[0.16em] text-quiet uppercase">
          Title
          <span>
            {state.title.length}/{TITLE_LIMIT}
          </span>
        </span>
        <input
          data-testid="title-input"
          value={state.title}
          maxLength={TITLE_LIMIT}
          onChange={(event) =>
            onChange({ ...state, title: event.target.value.slice(0, TITLE_LIMIT) })
          }
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] tracking-[0.16em] text-quiet uppercase">
          Target date and time
        </span>
        <input
          data-testid="target-input"
          type="datetime-local"
          value={toDatetimeLocal(state.target)}
          onChange={(event) => {
            const parsed = new Date(event.target.value).getTime()
            if (Number.isNaN(parsed)) return
            onChange({ ...state, target: parsed })
          }}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none"
        />
      </label>

      <fieldset>
        <legend className="mb-2 font-sans text-[11px] font-medium tracking-[0.18em] text-quiet uppercase">
          Theme
        </legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEMES) as ThemeId[]).map((id) => {
            const theme = THEMES[id]
            const active = state.theme === id
            return (
              <button
                key={id}
                type="button"
                data-testid={`theme-${id}`}
                aria-pressed={active}
                onClick={() => onChange({ ...state, theme: id })}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  active ? 'border-[var(--accent)]' : 'border-white/10'
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: theme.color, boxShadow: `0 0 0 1px rgba(0,0,0,0.4)` }}
                />
                {theme.label}
                <span className="text-quiet">{theme.note}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 font-sans text-[11px] font-medium tracking-[0.18em] text-quiet uppercase">
          Milestones
        </legend>
        <p className="text-xs leading-relaxed text-quiet">
          Up to five, in the order you’ll keep them. {MILESTONE_LIMIT} characters each.
        </p>
        {state.milestones.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Milestone {index + 1}</span>
              <input
                data-testid={`milestone-input-${index}`}
                value={item.label}
                maxLength={MILESTONE_LIMIT}
                onChange={(event) => {
                  const label = event.target.value.slice(0, MILESTONE_LIMIT)
                  const milestones = state.milestones.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, label } : entry,
                  )
                  onChange({ ...state, milestones })
                }}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
              />
            </label>
            <span className="w-12 shrink-0 text-right font-mono text-[11px] text-quiet">
              {item.label.length}/{MILESTONE_LIMIT}
            </span>
            <button
              type="button"
              aria-label={`Remove milestone ${index + 1}`}
              disabled={state.milestones.length <= 1}
              onClick={() => {
                const milestones = normalize(state.milestones.filter((_, entryIndex) => entryIndex !== index))
                onChange({ ...state, milestones })
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-quiet disabled:opacity-30"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          data-testid="add-milestone"
          disabled={state.milestones.length >= MAX_MILESTONES}
          onClick={() => {
            if (state.milestones.length >= MAX_MILESTONES) return
            onChange({
              ...state,
              milestones: [
                ...state.milestones,
                { id: uid(), label: 'New milestone', done: false },
              ],
            })
          }}
          className="mt-1 inline-flex items-center gap-2 text-sm text-ivory disabled:opacity-40"
        >
          <Plus size={14} />
          Add milestone
        </button>
      </fieldset>

      {includeChrome && (
        <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
          <div className="flex gap-2" role="group" aria-label="Lock screen shape">
            <button
              type="button"
              data-testid="mode-phone"
              aria-pressed={mode === 'phone'}
              onClick={() => onMode('phone')}
              className={`rounded-full px-3 py-1.5 text-xs tracking-[0.14em] uppercase ${
                mode === 'phone' ? 'ink-on-ivory' : 'border border-white/15 text-[#f6f1e7]'
              }`}
            >
              Phone
            </button>
            <button
              type="button"
              data-testid="mode-desk"
              aria-pressed={mode === 'desk'}
              onClick={() => onMode('desk')}
              className={`rounded-full px-3 py-1.5 text-xs tracking-[0.14em] uppercase ${
                mode === 'desk' ? 'ink-on-ivory' : 'border border-white/15 text-[#f6f1e7]'
              }`}
            >
              Desk
            </button>
          </div>
          <Switch
            checked={overlay}
            onChange={onOverlay}
            testId="toggle-overlay"
            label="Show OS Lock Screen Overlay"
          />
          {showBezel && (
            <Switch checked={bezel} onChange={onBezel} testId="toggle-bezel" label="Device bezel" />
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              data-testid="export-wallpaper"
              onClick={onExport}
              disabled={exporting}
              className="ink-on-ivory rounded-full px-4 py-2.5 text-sm font-medium"
            >
              {exporting ? 'Rendering wallpaper…' : 'Download Lock Screen Wallpaper (PNG)'}
            </button>
            <button
              type="button"
              data-testid="copy-link"
              onClick={onCopy}
              className="rounded-full border border-white/15 px-4 py-2.5 text-sm"
            >
              {copied ? 'Link copied' : 'Copy Shareable Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
