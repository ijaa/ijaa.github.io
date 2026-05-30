import { Volume2, VolumeX } from 'lucide-react'
import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { siteMeta } from '../content/site'

type HeaderProps = {
  active: string
  isScrolled: boolean
  soundEnabled: boolean
  soundReady: boolean
  onToggleSound: () => void
  onNavigate: (id: 'about' | 'projects' | 'contact') => void
  onHome: () => void
}

const links = [
  { id: 'about', label: '关于' },
  { id: 'projects', label: '项目' },
  { id: 'contact', label: '联系' },
]

export function Header({ active, isScrolled, soundEnabled, soundReady, onToggleSound, onNavigate, onHome }: HeaderProps) {
  const activeIndex = links.findIndex((item) => item.id === active)
  const hasActiveLink = activeIndex >= 0

  return (
    <>
      <header className="site-header">
        <button
          type="button"
          className={clsx('header-logo', isScrolled && 'header-logo-visible')}
          onClick={onHome}
          data-cursor="circle-black"
          aria-label="返回顶部"
        >
          {siteMeta.brand}
        </button>

        <div className="header-actions">
          <button
            className="header-sound"
            type="button"
            aria-label={soundEnabled ? '关闭声音' : '开启声音'}
            aria-pressed={soundEnabled}
            data-cursor="circle-black"
            onClick={onToggleSound}
            title={soundReady ? (soundEnabled ? '关闭声音' : '开启声音') : '声音初始化中'}
          >
            {soundEnabled ? <Volume2 aria-hidden="true" size={22} /> : <VolumeX aria-hidden="true" size={22} />}
          </button>
        </div>
      </header>

      <nav className={clsx('section-nav', isScrolled && 'section-nav-scrolled')} aria-label="主页分区">
        <span
          className={clsx('section-nav-indicator', hasActiveLink && 'section-nav-indicator-visible')}
          style={{ '--section-nav-active-index': Math.max(0, activeIndex) } as CSSProperties}
        />
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={clsx('section-nav-link', active === link.id && 'section-nav-link-active')}
            data-cursor="circle-black"
            onClick={() => onNavigate(link.id as 'about' | 'projects' | 'contact')}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </>
  )
}
