import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { mountScene, type LiveState, type SceneHandle } from '../scene/createScene.ts'

export type SceneController = {
  capture: () => HTMLCanvasElement
  kick: (amount: number) => void
  setPointer: (x: number, y: number) => void
}

type SceneHostProps = {
  target: number
  doneKey: string
  count: number
  themeHex: string
  reduced: boolean
  sceneRef: RefObject<SceneController | null>
}

export function SceneHost({ target, doneKey, count, themeHex, reduced, sceneRef }: SceneHostProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<LiveState>({
    target: 0,
    done: [],
    count: 0,
    themeHex: '#e0b15c',
    reducedMotion: false,
    pointerX: 0,
    pointerY: 0,
    pulseKick: 0,
  })

  useEffect(() => {
    const live = liveRef.current
    live.target = target
    live.done = doneKey.split('').map((bit) => bit === '1')
    live.count = count
    live.themeHex = themeHex
    live.reducedMotion = reduced
  }, [target, doneKey, count, themeHex, reduced])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let handle: SceneHandle | null = null
    let note: HTMLParagraphElement | null = null
    try {
      handle = mountScene(host, liveRef.current)
      sceneRef.current = {
        capture: () => handle!.capture(),
        kick: (amount: number) => {
          liveRef.current.pulseKick = amount
        },
        setPointer: (x: number, y: number) => {
          liveRef.current.pointerX = x
          liveRef.current.pointerY = y
        },
      }
    } catch (error) {
      console.error(error)
      note = document.createElement('p')
      note.className = 'absolute right-[8%] bottom-[20%] left-[8%] text-sm text-[#f6f1e7]/80'
      note.textContent = 'This display can’t run the live scene. The countdown still keeps time.'
      host.appendChild(note)
    }
    return () => {
      handle?.dispose()
      note?.remove()
      if (sceneRef.current) sceneRef.current = null
    }
  }, [sceneRef])

  return <div ref={hostRef} className="absolute inset-0 z-0" data-testid="scene-host" />
}
