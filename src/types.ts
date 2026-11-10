export const THEMES = {
  aureole: {
    id: 'aureole',
    label: 'Aureole',
    note: 'Antique gold',
    color: '#e0b15c',
  },
  vellum: {
    id: 'vellum',
    label: 'Vellum',
    note: 'Sage paper',
    color: '#b7c4a4',
  },
  signal: {
    id: 'signal',
    label: 'Signal',
    note: 'Warm copper',
    color: '#e08a62',
  },
} as const

export type ThemeId = keyof typeof THEMES

export type Milestone = {
  id: string
  label: string
  done: boolean
}

export type LockState = {
  title: string
  target: number
  milestones: Milestone[]
  theme: ThemeId
}

export type FrameMode = 'phone' | 'desk'

export const TITLE_LIMIT = 48
export const MILESTONE_LIMIT = 32
export const MAX_MILESTONES = 5
export const PROGRESS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === 'aureole' || value === 'vellum' || value === 'signal'
}
