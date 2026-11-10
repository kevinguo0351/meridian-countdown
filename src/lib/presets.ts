import {
  THEMES,
  type LockState,
  type Milestone,
  type ThemeId,
} from '../types.ts'

export type PresetId = 'career' | 'thesis' | 'ship'

export type Preset = {
  id: PresetId
  name: string
  title: string
  theme: ThemeId
  days: number
  milestones: string[]
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'career',
    name: 'Career / Interview Sprint',
    title: 'Dream Offer Sprint',
    theme: 'aureole',
    days: 14,
    milestones: [
      'Portfolio narrative locked',
      'System design dry run',
      'Behavioral stories cut',
      'Onsite loop, calm pace',
      'Decision & thank-you notes',
    ],
  },
  {
    id: 'thesis',
    name: 'Thesis / Exam Crunch',
    title: 'Defense Week',
    theme: 'vellum',
    days: 21,
    milestones: [
      'Literature map finished',
      'Methods chapter drafted',
      'Advisor notes folded in',
      'Slides rehearsed twice',
      'Defend, then breathe',
    ],
  },
  {
    id: 'ship',
    name: 'Product Ship / Hackathon',
    title: 'Launch Window',
    theme: 'signal',
    days: 9,
    milestones: [
      'Scope frozen in writing',
      'Core loop is demoable',
      'Empty states have copy',
      'Polish pass, no new ideas',
      'Ship and write the note',
    ],
  },
]

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function createPreset(id: PresetId, now = Date.now()): LockState {
  const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0]
  return {
    title: preset.title,
    target: now + preset.days * 24 * 60 * 60 * 1000,
    theme: preset.theme,
    milestones: preset.milestones.map((label) => ({
      id: uid(),
      label,
      done: false,
    })),
  }
}

export function defaultState(now = Date.now()): LockState {
  return createPreset('career', now)
}

export function themeColor(theme: ThemeId): string {
  return THEMES[theme].color
}

export function normalize(items: Milestone[]): Milestone[] {
  let locked = false
  return items.map((item) => {
    if (locked) return { ...item, done: false }
    if (!item.done) locked = true
    return item
  })
}

export function currentIndex(milestones: Milestone[]): number {
  return milestones.findIndex((item) => !item.done)
}

export function canToggle(milestones: Milestone[], index: number): boolean {
  const current = currentIndex(milestones)
  if (current === -1) return index === milestones.length - 1
  if (index === current) return true
  return index === current - 1
}

export function applyToggle(milestones: Milestone[], index: number): Milestone[] {
  if (!canToggle(milestones, index)) return milestones
  const next = milestones.map((item, i) =>
    i === index ? { ...item, done: !item.done } : item,
  )
  return normalize(next)
}
