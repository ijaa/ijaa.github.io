import { useEffect, useState } from 'react'

type PreloaderProps = {
  onDone: () => void
}

export function Preloader({ onDone }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let value = 0
    const timer = window.setInterval(() => {
      value += Math.max(7, (100 - value) * 0.24)
      const next = Math.min(100, Math.round(value))
      setProgress(next)

      if (next >= 100) {
        window.clearInterval(timer)
        setLeaving(true)
        window.setTimeout(onDone, 420)
      }
    }, 34)

    return () => window.clearInterval(timer)
  }, [onDone])

  return (
    <div className={`preloader ${leaving ? 'preloader-leaving' : ''}`}>
      <div className="preloader-emblem" aria-hidden="true">
        <span>IJAA</span>
        <i style={{ transform: `scaleY(${progress / 100})` }} />
      </div>
      <p className="preloader-count">{progress.toString().padStart(3, '0')}</p>
    </div>
  )
}
