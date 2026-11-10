import { createPreset, normalize, uid } from './presets.ts'
import {
  MILESTONE_LIMIT,
  MAX_MILESTONES,
  TITLE_LIMIT,
  isThemeId,
  type LockState,
  type Milestone,
} from '../types.ts'

const STORAGE_KEY = 'meridian-lock-v1'

function cleanLabel(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MILESTONE_LIMIT)
}

function parseMilestones(raw: unknown): Milestone[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const items: Milestone[] = []
  for (const row of raw.slice(0, MAX_MILESTONES)) {
    if (!Array.isArray(row) || row.length < 2) return null
    const label = cleanLabel(row[1])
    if (!label) return null
    items.push({
      id: uid(),
      label,
      done: row[0] === 1 || row[0] === true,
    })
  }
  return normalize(items)
}

function sanitize(partial: Partial<LockState>, now: number): LockState {
  const base = createPreset('career', now)
  const title = (partial.title ?? base.title).trim().slice(0, TITLE_LIMIT) || base.title
  const target =
    typeof partial.target === 'number' && Number.isFinite(partial.target)
      ? partial.target
      : base.target
  const theme = partial.theme && isThemeId(partial.theme) ? partial.theme : base.theme
  const milestones =
    partial.milestones && partial.milestones.length > 0
      ? normalize(
          partial.milestones.slice(0, MAX_MILESTONES).map((item) => ({
            id: item.id || uid(),
            label: cleanLabel(item.label) || 'Untitled step',
            done: Boolean(item.done),
          })),
        )
      : base.milestones
  return { title, target, theme, milestones }
}

export function encodeMilestones(milestones: Milestone[]): string {
  return JSON.stringify(milestones.map((item) => [item.done ? 1 : 0, item.label]))
}

export function readUrl(search: string, now = Date.now()): LockState | null {
  const params = new URLSearchParams(search)
  const has =
    params.has('title') || params.has('target') || params.has('m') || params.has('theme')
  if (!has) return null

  const partial: Partial<LockState> = {}
  if (params.has('title')) partial.title = params.get('title') ?? ''
  if (params.has('target')) {
    const parsed = Date.parse(params.get('target') ?? '')
    if (!Number.isNaN(parsed)) partial.target = parsed
  }
  if (params.has('theme')) {
    const theme = params.get('theme')
    if (isThemeId(theme)) partial.theme = theme
  }
  if (params.has('m')) {
    try {
      const milestones = parseMilestones(JSON.parse(params.get('m') ?? ''))
      if (milestones) partial.milestones = milestones
    } catch {
      /* keep preset milestones */
    }
  }
  return sanitize(partial, now)
}

export function readStorage(now = Date.now()): LockState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<LockState> & { v?: number }
    if (!data || typeof data !== 'object') return null
    return sanitize(data, now)
  } catch {
    return null
  }
}

export function loadState(now = Date.now()): LockState {
  return readUrl(window.location.search, now) ?? readStorage(now) ?? createPreset('career', now)
}

export function writeStorage(state: LockState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 1,
        title: state.title,
        target: state.target,
        theme: state.theme,
        milestones: state.milestones,
      }),
    )
  } catch {
    /* private mode */
  }
}

export function writeUrl(state: LockState): void {
  const params = new URLSearchParams()
  params.set('title', state.title)
  params.set('target', new Date(state.target).toISOString())
  params.set('m', encodeMilestones(state.milestones))
  params.set('theme', state.theme)
  const next = `${location.pathname}?${params.toString()}`
  const current = `${location.pathname}${location.search}`
  if (next === current) return
  try {
    history.replaceState(null, '', next)
  } catch {
    /* file:// */
  }
}

export function shareableHref(): string {
  return location.href
}
