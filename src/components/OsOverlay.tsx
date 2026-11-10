import { Camera, Flashlight } from 'lucide-react'
import { formatClock, formatDate } from '../lib/time.ts'
import type { FrameMode } from '../types.ts'

type OsOverlayProps = {
  now: number
  mode: FrameMode
}

export function OsOverlay({ now, mode }: OsOverlayProps) {
  const clock = formatClock(now)
  const phone = mode === 'phone'

  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-testid="os-overlay">
      <div
        className="absolute inset-x-0 top-0 h-[30%]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0.16) 58%, rgba(0,0,0,0))',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[20%]"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.46), rgba(0,0,0,0))',
        }}
      />

      {phone && (
        <div
          className="absolute left-1/2 h-[3.4%] w-[29%] -translate-x-1/2 rounded-full bg-black"
          style={{ top: 'max(0.9cqh, env(safe-area-inset-top))' }}
          aria-hidden
        />
      )}

      <div
        className="absolute inset-x-0 flex flex-col items-center text-center"
        style={{ top: phone ? '11.5%' : '8%' }}
      >
        <p
          className="font-sans font-medium text-ivory/90"
          style={{ fontSize: phone ? '2.15cqh' : '2.6cqh', letterSpacing: '0.01em' }}
        >
          {formatDate(now)}
        </p>
        <p
          className="mt-[0.4cqh] font-sans font-light leading-none tracking-[-0.045em] text-ivory"
          style={{ fontSize: phone ? '11.4cqh' : '13cqh' }}
        >
          {clock.time}
          <span
            className="ml-[0.6cqw] align-top font-sans font-medium tracking-[0.14em] text-ivory/80"
            style={{ fontSize: phone ? '2.1cqh' : '2.5cqh' }}
          >
            {clock.ampm}
          </span>
        </p>
      </div>

      <div
        className="absolute inset-x-[7%] flex items-center justify-between"
        style={{ bottom: 'max(2.6cqh, env(safe-area-inset-bottom))' }}
      >
        <span
          className="grid place-items-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md"
          style={{ width: '6.2cqh', height: '6.2cqh' }}
          aria-hidden
        >
          <Flashlight style={{ width: '2.5cqh', height: '2.5cqh' }} strokeWidth={1.6} />
        </span>
        <span
          className="grid place-items-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md"
          style={{ width: '6.2cqh', height: '6.2cqh' }}
          aria-hidden
        >
          <Camera style={{ width: '2.5cqh', height: '2.5cqh' }} strokeWidth={1.6} />
        </span>
      </div>
    </div>
  )
}
