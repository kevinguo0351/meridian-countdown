import type { ReactNode } from 'react'
import type { FrameMode } from '../types.ts'

type LockScreenProps = {
  mode: FrameMode
  bezel: boolean
  native: boolean
  onPointerMove: (x: number, y: number) => void
  onPointerLeave: () => void
  children: ReactNode
}

export function LockScreen({
  mode,
  bezel,
  native,
  onPointerMove,
  onPointerLeave,
  children,
}: LockScreenProps) {
  const desk = mode === 'desk' && !native

  const screen = (
    <div
      className={`lock-screen relative overflow-hidden bg-[#0b0c0e] ${
        native ? 'h-full w-full' : desk ? 'h-full w-full rounded-[1.4rem]' : 'h-full w-full rounded-[2.15rem]'
      }`}
      data-testid="lock-screen"
      data-mode={native ? 'native' : mode}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
        onPointerMove(x, y)
      }}
      onPointerLeave={onPointerLeave}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 z-30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
        style={{ borderRadius: 'inherit' }}
      />
    </div>
  )

  if (native) {
    return <div className="fixed inset-0 z-10 touch-none">{screen}</div>
  }

  return (
    <div
      className="relative mx-auto"
      style={
        desk
          ? { width: 'min(1080px, calc(100vw - 2.5rem))', aspectRatio: '16 / 9' }
          : { height: 'min(980px, calc(100dvh - 7.25rem))', aspectRatio: '9 / 19.5' }
      }
    >
      {bezel ? (
        <div className="relative h-full w-full">
          {!desk && (
            <>
              <span className="absolute top-[18%] -left-[3px] h-7 w-[3px] rounded-l bg-[#2c2d31]" aria-hidden />
              <span className="absolute top-[26%] -left-[3px] h-14 w-[3px] rounded-l bg-[#2c2d31]" aria-hidden />
              <span className="absolute top-[22%] -right-[3px] h-20 w-[3px] rounded-r bg-[#3a3b40]" aria-hidden />
            </>
          )}
          <div
            className={`h-full w-full bg-[#050506] shadow-[0_30px_80px_rgba(0,0,0,0.55)] ${
              desk ? 'rounded-[1.8rem] p-[10px]' : 'rounded-[2.8rem] p-[11px]'
            }`}
            style={{
              background:
                'linear-gradient(160deg, #3c3d42 0%, #121316 28%, #07080a 62%, #2a2b30 100%)',
            }}
            data-testid="device-bezel"
          >
            <div className="h-full w-full">{screen}</div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full shadow-[0_30px_80px_rgba(0,0,0,0.45)]">{screen}</div>
      )}
    </div>
  )
}
