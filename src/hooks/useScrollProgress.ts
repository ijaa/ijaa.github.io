import { useEffect, useState } from 'react'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const viewport = Math.max(1, window.innerHeight)
        const documentScrollable = Math.max(1, document.documentElement.scrollHeight - viewport)
        const designedScrollable = viewport * 5.6
        const scrollable = Math.min(documentScrollable, designedScrollable)
        setProgress(clamp01(window.scrollY / scrollable))
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return progress
}
