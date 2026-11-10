import { Fragment } from 'react'
import { moodLine, pad, remaining } from '../lib/time.ts'
import type { FrameMode } from '../types.ts'

type CountdownProps = {
  title: string
  target: number
  now: number
  mode: FrameMode
}

const UNITS = ['Days', 'Hours', 'Mins', 'Secs'] as const

export function Countdown({ title, target, now, mode }: CountdownProps) {
  const parts = remaining(target, now)
  const values = [
    pad(parts.days, parts.days > 99 ? 3 : 2),
    pad(parts.hours),
    pad(parts.mins),
    pad(parts.secs),
  ]
  const desk = mode === 'desk'

  const legible = { textShadow: '0 1px 1px rgba(0,0,0,0.9), 0 0 14px rgba(0,0,0,0.55)' }

  return (
    <div data-testid="countdown">
      <p>
        <span
          className="inline-block rounded-full bg-[#0b0c0e]/88 font-sans font-semibold uppercase text-[#f7f3ea] ring-1 ring-white/15"
          style={{
            fontSize: desk ? '1.85cqh' : '1.45cqh',
            letterSpacing: '0.22em',
            padding: desk ? '0.45cqh 1.1cqh' : '0.38cqh 0.95cqh',
            ...legible,
          }}
        >
          Counting down
        </span>
      </p>
      <h2
        className="mt-[1cqh] max-w-[18ch] font-serif font-medium italic leading-[1.05] tracking-[-0.03em] text-ivory"
        style={{ fontSize: desk ? '5.4cqh' : '3.7cqh', ...legible }}
      >
        {title}
      </h2>
      <div
        className="mt-[2cqh] grid items-start"
        style={{
          gridTemplateColumns: 'max-content auto max-content auto max-content auto max-content',
          columnGap: desk ? '1.1cqw' : '0.7cqw',
          justifyContent: 'start',
        }}
        aria-label={`${values[0]} days, ${values[1]} hours, ${values[2]} minutes, ${values[3]} seconds`}
      >
        {values.map((value, index) => (
          <Fragment key={UNITS[index]}>
            <div className="min-w-0">
              <span
                className="font-mono font-light leading-none tracking-[-0.04em] text-ivory tabular-nums"
                style={{ fontSize: desk ? '8.2cqh' : '5.15cqh', ...legible }}
                data-testid={`count-${UNITS[index].toLowerCase()}`}
              >
                {value}
              </span>
              <p
                className="mt-[0.7cqh] font-sans font-medium uppercase text-[#efe8dc]"
                style={{ fontSize: desk ? '1.45cqh' : '1.15cqh', letterSpacing: '0.16em', ...legible }}
              >
                {UNITS[index]}
              </p>
            </div>
            {index < 3 && (
              <span
                className="px-[0.35cqw] font-mono leading-none text-[var(--accent)]"
                style={{ fontSize: desk ? '5.4cqh' : '3.6cqh', paddingTop: '0.15cqh' }}
                aria-hidden
              >
                :
              </span>
            )}
          </Fragment>
        ))}
      </div>
      <p
        className="mt-[1.4cqh] font-serif italic text-[#f3e2b8]"
        style={{ fontSize: desk ? '2.3cqh' : '1.7cqh', ...legible }}
      >
        {moodLine(target, now)}
      </p>
    </div>
  )
}
