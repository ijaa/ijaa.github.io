import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type CursorKind = 'circle-black' | 'circle-white' | 'arrow' | null

function findCursorKind(target: EventTarget | null): CursorKind {
  let element = target instanceof HTMLElement ? target : null
  while (element) {
    const cursor = element.dataset.cursor
    if (cursor === 'circle-black' || cursor === 'circle-white' || cursor === 'arrow') {
      return cursor
    }
    element = element.parentElement
  }
  return null
}

export function Cursor() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [kind, setKind] = useState<CursorKind>(null)

  useEffect(() => {
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let currentX = mouseX
    let currentY = mouseY
    let frame = 0

    const move = (event: MouseEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      setKind(findCursorKind(event.target))
    }

    const tick = () => {
      currentX += (mouseX - currentX) * 0.14
      currentY += (mouseY - currentY) * 0.14
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      }
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', move)
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', move)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={wrapperRef} className={`cursor-shell ${kind ? 'cursor-shell-visible' : ''}`} aria-hidden="true">
      <div className={`cursor-dot cursor-dot-${kind ?? 'none'}`}>
        {kind === 'arrow' ? <ArrowUpRight size={24} strokeWidth={2.8} /> : null}
      </div>
    </div>
  )
}
