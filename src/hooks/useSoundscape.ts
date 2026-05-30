import { useEffect, useRef, useState } from 'react'

const luciSrc = '/reference/audio/luci.ogg'
const aboutSrc = '/reference/audio/about.ogg'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function useSoundscape(enabled: boolean, aboutMix: number) {
  const [ready, setReady] = useState(false)
  const luciRef = useRef<HTMLAudioElement | null>(null)
  const aboutRef = useRef<HTMLAudioElement | null>(null)
  const resumedRef = useRef(false)
  const enabledRef = useRef(enabled)
  const aboutMixRef = useRef(aboutMix)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    aboutMixRef.current = aboutMix
  }, [aboutMix])

  useEffect(() => {
    const luci = new Audio(luciSrc)
    const about = new Audio(aboutSrc)

    luci.loop = true
    about.loop = true
    luci.preload = 'auto'
    about.preload = 'auto'
    luci.volume = 0.2
    about.volume = 0

    luciRef.current = luci
    aboutRef.current = about
    setReady(true)

    const updateVolumes = () => {
      const aboutValue = clamp01(aboutMixRef.current)
      luci.volume = enabledRef.current ? Math.max(0, 1 - aboutValue) * 0.2 : 0
      about.volume = enabledRef.current ? aboutValue * 0.3 : 0
    }

    const tryPlay = async () => {
      if (!enabledRef.current) return
      try {
        await Promise.all([luci.play(), about.play()])
      } catch {
        // Some browsers require a user gesture before playback starts.
      }
    }

    updateVolumes()
    tryPlay()

    const resume = () => {
      if (resumedRef.current) return
      resumedRef.current = true
      void tryPlay()
    }

    window.addEventListener('pointerdown', resume, { passive: true })
    window.addEventListener('keydown', resume)

    return () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
      luci.pause()
      about.pause()
      luciRef.current = null
      aboutRef.current = null
    }
  }, [])

  useEffect(() => {
    const luci = luciRef.current
    const about = aboutRef.current
    if (!luci || !about) return

    const aboutValue = clamp01(aboutMix)
    luci.volume = enabled ? Math.max(0, 1 - aboutValue) * 0.2 : 0
    about.volume = enabled ? aboutValue * 0.3 : 0

    if (enabled) {
      void Promise.all([
        luci.paused ? luci.play().catch(() => {}) : Promise.resolve(),
        about.paused ? about.play().catch(() => {}) : Promise.resolve(),
      ])
    } else {
      luci.pause()
      about.pause()
    }
  }, [aboutMix, enabled])

  return ready
}
