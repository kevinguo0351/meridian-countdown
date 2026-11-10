import { Check } from 'lucide-react'
import { canToggle, currentIndex } from '../lib/presets.ts'
import type { FrameMode, Milestone } from '../types.ts'

type MilestoneListProps = {
  milestones: Milestone[]
  mode: FrameMode
  onToggle: (index: number) => void
}

export function MilestoneList({ milestones, mode, onToggle }: MilestoneListProps) {
  const current = currentIndex(milestones)
  const desk = mode === 'desk'

  return (
    <div>
      <ol className="flex flex-col" style={{ gap: desk ? '1cqh' : '0.7cqh' }}>
        {milestones.map((item, index) => {
          const status = item.done ? 'done' : index === current ? 'current' : 'upcoming'
          const interactive = canToggle(milestones, index)
          const body = (
            <>
              <span
                className={`grid shrink-0 place-items-center rounded-full border ${
                  status === 'current'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15'
                    : status === 'done'
                      ? 'border-quiet/70'
                      : 'border-ivory/40'
                }`}
                style={{ width: desk ? '3.2cqh' : '2.5cqh', height: desk ? '3.2cqh' : '2.5cqh' }}
                aria-hidden
              >
                {item.done ? (
                  <Check style={{ width: '1.3cqh', height: '1.3cqh' }} strokeWidth={2.4} />
                ) : status === 'current' ? (
                  <span
                    className="rounded-full bg-[var(--accent)]"
                    style={{ width: '0.9cqh', height: '0.9cqh' }}
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                {status === 'current' && (
                  <span
                    className="mb-[0.25cqh] block font-sans font-semibold uppercase text-[var(--accent)]"
                    style={{ fontSize: desk ? '1.35cqh' : '1.05cqh', letterSpacing: '0.18em' }}
                  >
                    Next up
                  </span>
                )}
                <span
                  className={`block leading-snug ${
                    status === 'done'
                      ? 'text-[#c4bdb2]'
                      : status === 'current'
                        ? 'font-medium text-ivory'
                        : 'text-[#e7e1d6]'
                  }`}
                  style={{ fontSize: desk ? '2.15cqh' : '1.72cqh' }}
                >
                  {item.label}
                </span>
              </span>
            </>
          )

          return (
            <li key={item.id}>
              {interactive ? (
                <button
                  type="button"
                  data-testid={status === 'current' ? 'milestone-current' : 'milestone-undo'}
                  aria-pressed={item.done}
                  onClick={() => onToggle(index)}
                  className={`flex w-full items-center text-left transition active:scale-[0.99] ${
                    status === 'current'
                      ? 'rounded-2xl border border-[var(--accent)] bg-[#0b0c0e]/80 shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_32%,transparent)]'
                      : 'rounded-xl border border-transparent'
                  }`}
                  style={{
                    gap: '1.4cqh',
                    padding: status === 'current' ? '1.15cqh 1.4cqh' : '0.45cqh 0.2cqh',
                  }}
                >
                  {body}
                </button>
              ) : (
                <div
                  className="flex items-center"
                  data-testid={`milestone-${status}`}
                  style={{ gap: '1.4cqh', padding: '0.45cqh 0.2cqh' }}
                >
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {current === -1 && milestones.length > 0 && (
        <p
          className="mt-[1.2cqh] font-serif italic text-[var(--accent)]"
          style={{ fontSize: desk ? '2.2cqh' : '1.7cqh' }}
        >
          Every step kept.
        </p>
      )}
    </div>
  )
}
