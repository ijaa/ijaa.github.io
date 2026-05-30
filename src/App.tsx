import { useEffect, useMemo, useRef, useState } from 'react'
import { Banner } from './components/Banner'
import { Cursor } from './components/Cursor'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Preloader } from './components/Preloader'
import { ProjectCard } from './components/ProjectCard'
import { SocialLinks } from './components/SocialLinks'
import { projects, services } from './content/projects'
import { useLenis } from './hooks/useLenis'
import { useSoundscape } from './hooks/useSoundscape'
import { PortfolioCanvas, type SceneState } from './three/PortfolioScene'

type SectionId = 'hero' | 'about' | 'projects' | 'contact'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const triggerProgress = (triggerTop: number, triggerBottom: number, startLine: number, endLine: number) => {
  const startScroll = triggerTop - startLine
  const endScroll = triggerBottom - endLine
  return clamp01((window.scrollY - startScroll) / Math.max(1, endScroll - startScroll))
}

const triggerInProgress = (triggerTop: number, startLine: number, endLine: number) => {
  const startScroll = triggerTop - startLine
  const endScroll = triggerTop - endLine
  return clamp01((window.scrollY - startScroll) / Math.max(1, endScroll - startScroll))
}

const triggerOutProgress = (triggerBottom: number, startLine: number, endLine: number) => {
  const startScroll = triggerBottom - startLine
  const endScroll = triggerBottom - endLine
  return clamp01((window.scrollY - startScroll) / Math.max(1, endScroll - startScroll))
}

export function App() {
  const [ready, setReady] = useState(false)
  const [hoveredProject, setHoveredProject] = useState(0)
  const [activeSection, setActiveSection] = useState<SectionId>('hero')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [sceneState, setSceneState] = useState<SceneState>({
    hero: 1,
    heroOut: 0,
    about: 0,
    aboutIn: 0,
    aboutOut: 0,
    aboutProgress: 0,
    aboutStage: 0,
    projects: 0,
    contact: 0,
    contactIn: 0,
  })
  const [scrollYValue, setScrollYValue] = useState(0)
  const [stickyVisible, setStickyVisible] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [contactBottom, setContactBottom] = useState(0)
  const introRef = useRef<HTMLDivElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const aboutRef = useRef<HTMLElement | null>(null)
  const projectsRef = useRef<HTMLElement | null>(null)
  const contactRef = useRef<HTMLDivElement | null>(null)
  useLenis()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    if (ready) {
      document.body.classList.remove('is-loading')
      window.setTimeout(() => {
        const params = new URLSearchParams(window.location.search)
        const debugScroll = params.get('debug-scroll')
        if (debugScroll === 'about-mid' && aboutRef.current) {
          const aboutTop = aboutRef.current.getBoundingClientRect().top + window.scrollY
          setStickyVisible(true)
          window.scrollTo(0, aboutTop + window.innerHeight * 0.12)
          return
        }
        if (debugScroll === 'contact-mid' && contactRef.current) {
          const contactTop = contactRef.current.getBoundingClientRect().top + window.scrollY
          setStickyVisible(true)
          window.scrollTo(0, contactTop)
          return
        }
        if ((window.location.hash === '#about' || window.location.hash === '#about-debug') && aboutRef.current) {
          const aboutTop = aboutRef.current.getBoundingClientRect().top + window.scrollY
          setStickyVisible(true)
          window.scrollTo(0, aboutTop + window.innerHeight * 0.12)
          return
        }
        if (window.location.hash === '#projects' && projectsRef.current) {
          const projectsTop = projectsRef.current.getBoundingClientRect().top + window.scrollY
          setStickyVisible(false)
          window.scrollTo(0, projectsTop)
          return
        }
        if (window.location.hash === '#contact' && contactRef.current) {
          const contactTop = contactRef.current.getBoundingClientRect().top + window.scrollY
          setStickyVisible(true)
          window.scrollTo(0, contactTop)
          return
        }
        if (window.location.hash) {
          document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' })
          return
        }
        window.scrollTo(0, 0)
      }, 80)
    }
  }, [ready])

  useEffect(() => {
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const viewport = Math.max(1, window.innerHeight)
        const aboutElement = aboutRef.current
        const contactElement = contactRef.current

        if (!aboutElement || !contactElement) return

        const aboutRect = aboutElement.getBoundingClientRect()
        const aboutTopAbs = aboutRect.top + window.scrollY
        const aboutBottomAbs = aboutTopAbs + aboutElement.offsetHeight
        const aboutStage = triggerProgress(aboutTopAbs, aboutBottomAbs, 0, 0)
        const projectsStart = aboutBottomAbs
        const projectsVisible = clamp01((window.scrollY - (projectsStart - viewport * 0.65)) / Math.max(1, viewport * 1.05))

        const contactRect = contactElement.getBoundingClientRect()
        const contactVisible = clamp01((viewport - contactRect.top) / Math.max(1, viewport * 0.9))

        setScrollYValue(window.scrollY)

        const documentBottom = document.documentElement.scrollHeight
        const elementBottom = contactRect.bottom + window.scrollY
        setContactBottom(documentBottom - elementBottom)

        const isLandscape = window.innerWidth >= window.innerHeight
        const aboutInStartLine = viewport + (window.innerWidth >= 840 ? 320 : 120)
        const aboutInEndLine = 0
        const aboutSectionsStartLine = isLandscape ? viewport * 0.35 : viewport * 0.25
        const aboutProgressStartLine = isLandscape ? viewport * 0.78 : viewport * 0.64
        const heroOut = triggerInProgress(aboutTopAbs, aboutInStartLine, aboutInEndLine)
        const aboutBase = 0.1 + aboutStage * 0.52
        const projectsBase = 0.6 + projectsVisible * 0.18
        const contactBase = 0.78 + contactVisible * 0.2
        const nextProgress =
          window.scrollY < aboutElement.offsetTop - viewport * 0.28
            ? heroOut * 0.1
            : window.scrollY < projectsStart - viewport * 0.52
              ? aboutBase
              : window.scrollY < contactRect.top + window.scrollY - viewport * 0.48
                ? projectsBase
                : contactBase

        const normalizedProgress = window.scrollY < 4 ? 0 : nextProgress
        setScrollProgress(normalizedProgress)

        const triggerLine = viewport * 0.35
        const projectsTop = projectsRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
        const contactTop = contactElement.getBoundingClientRect().top
        const aboutTop = aboutElement.getBoundingClientRect().top
        const heroTop = heroRef.current?.getBoundingClientRect().top ?? 0
        setStickyVisible(projectsTop > 0 || contactVisible > 0.02)

        if (contactTop <= triggerLine) {
          setActiveSection('contact')
        } else if (projectsTop <= triggerLine) {
          setActiveSection('projects')
        } else if (aboutTop <= triggerLine) {
          setActiveSection('about')
        } else if (heroTop <= triggerLine) {
          setActiveSection('hero')
        }

        const heroStage = 1 - heroOut
        const aboutIn = window.scrollY < 4 ? 0 : triggerInProgress(aboutTopAbs, aboutInStartLine, aboutInEndLine)
        const aboutOut = triggerOutProgress(aboutBottomAbs, viewport, 0)
        const aboutProgress = window.scrollY < 4 ? 0 : triggerProgress(aboutTopAbs, aboutBottomAbs, aboutProgressStartLine, viewport)
        const aboutValue = aboutIn * (1 - aboutOut)
        const aboutMid = clamp01((aboutStage - 0.2) / 0.64)
        const projectsValue = clamp01((viewport * 0.5 - projectsTop) / Math.max(1, viewport)) * (1 - contactVisible)
        const contactIn = clamp01((viewport - contactTop) / Math.max(1, contactElement.offsetHeight || viewport))
        const nextSceneState: SceneState = {
          hero: heroStage,
          heroOut: 1 - heroStage,
          about: aboutValue,
          aboutIn,
          aboutOut,
          aboutProgress,
          aboutStage: aboutMid,
          projects: projectsValue,
          contact: contactIn,
          contactIn,
        }
        setSceneState(nextSceneState)
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

  const activeProjectIndex = useMemo(() => {
    return Math.min(projects.length - 1, Math.max(0, hoveredProject))
  }, [hoveredProject])

  const heroOut = sceneState.heroOut
  const aboutProgress = sceneState.aboutProgress
  const aboutOverlayVisible = clamp01((sceneState.aboutIn - 0.28) / 0.28)
  const aboutDescriptionVisible = aboutOverlayVisible * (1 - clamp01((sceneState.aboutProgress - 0.58) / 0.16))
  const aboutServicesVisible = clamp01((sceneState.aboutProgress - 0.66) / 0.14)
  const aboutDetailsVisible =
    clamp01((sceneState.aboutProgress - 0.14) / 0.14) * (1 - clamp01((sceneState.aboutProgress - 0.56) / 0.14))
  const aboutCountVisible = clamp01((sceneState.aboutProgress - 0.18) / 0.16)
  const soundReady = useSoundscape(soundEnabled, sceneState.aboutIn)

  const scrollToSection = (id: SectionId) => {
    if (id === 'about' && aboutRef.current) {
      const aboutTop = aboutRef.current.getBoundingClientRect().top + window.scrollY
      setStickyVisible(true)
      window.scrollTo({ top: aboutTop + window.innerHeight * 0.12, behavior: 'smooth' })
      return
    }
    if (id === 'contact' && contactRef.current) {
      const contactTop = contactRef.current.getBoundingClientRect().top + window.scrollY
      setStickyVisible(true)
      window.scrollTo({ top: contactTop, behavior: 'smooth' })
      return
    }
    if (id === 'projects' && projectsRef.current) {
      const projectsTop = projectsRef.current.getBoundingClientRect().top + window.scrollY
      setStickyVisible(false)
      window.scrollTo({ top: projectsTop, behavior: 'smooth' })
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="site-root">
      {!ready ? <Preloader onDone={() => setReady(true)} /> : null}

      <Header
        active={activeSection}
        isScrolled={scrollYValue > 24}
        soundEnabled={soundEnabled}
        soundReady={soundReady}
        onToggleSound={() => setSoundEnabled((value) => !value)}
        onHome={() => scrollToSection('hero')}
        onNavigate={(id) => scrollToSection(id)}
      />
      <Cursor />

      <main className={`page-shell ${ready ? 'page-shell-ready' : 'page-shell-hidden'}`}>
        <div ref={introRef} className="intro-wrapper">
          <div
            className={`intro-sticky ${stickyVisible ? 'intro-sticky-visible' : ''}`}
            style={{ '--contact-bottom': `${contactBottom}px` } as React.CSSProperties}
          >
            <div className="intro-sticky-stage">
              <PortfolioCanvas
                sceneState={sceneState}
                activeProject={activeProjectIndex}
                ready={ready}
                className={!stickyVisible && activeSection === 'contact' ? 'scene-canvas-contact' : undefined}
              />

              <div className={`intro-overlay-layer ${activeSection === 'contact' ? 'intro-about-hidden' : ''}`}>
                <div className="about-overlay">
                  <div className="section-shell about-overlay-shell">
                    <div className="hologram-layer" aria-label="个人能力信息">
                      <article
                        className="holo-box holo-box-details"
                        style={{ '--holo-opacity': aboutDetailsVisible } as React.CSSProperties}
                      >
                        <div className="holo-box-content">
                          <div className="holo-box-header">
                            <p className="holo-box-name">IJAA</p>
                            <p className="holo-box-place">中国</p>
                          </div>
                        </div>
                      </article>

                      <article
                        className="holo-box holo-box-description"
                        style={{ '--holo-opacity': aboutDescriptionVisible } as React.CSSProperties}
                      >
                        <div className="holo-box-content">
                          <div className="holo-box-header">
                            <p className="holo-box-name">IJAA</p>
                            <p className="holo-box-place">AI / WebGL</p>
                          </div>
                          <div className="holo-line" />
                          <p className="holo-copy">
                            多年Coding老司机、后端工程师、前鹅厂混混、注意力不集中受害者。现专注于AI Agent应用、图片生成艺术、个人独立开发。
                          </p>
                        </div>
                      </article>

                      <article
                        className="holo-box holo-box-services"
                        style={{ '--holo-opacity': aboutServicesVisible } as React.CSSProperties}
                      >
                        <div className="holo-box-content">
                          <p className="holo-box-title">能力栈</p>
                          <ul className="service-list">
                            {services.map((service) => (
                              <li key={service}>{service}</li>
                            ))}
                          </ul>
                        </div>
                      </article>

                      <div
                        className="about-progress-count"
                        style={
                          {
                            '--about-progress': `${Math.round(aboutProgress * 100)}%`,
                            opacity: aboutCountVisible,
                          } as React.CSSProperties
                        }
                      >
                        <span />
                        <strong>{Math.round(aboutProgress * 100)}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section id="hero" ref={heroRef} className="hero-section">
            <div className="section-shell hero-grid grid min-h-screen items-start lg:items-center">
              <div
                className="hero-copy"
                id="hero-content-inner"
                style={
                  {
                    '--hero-shift-x': `${heroOut * 27}vw`,
                    '--hero-shift-y': `${heroOut * 10}vh`,
                    '--hero-rotate': `${heroOut * 4}deg`,
                    '--hero-fade': `${1 - Math.min(1, heroOut * 1.35)}`,
                  } as React.CSSProperties
                }
              >
                <div className="hero-title-wrap">
                  <h1 className="hero-title">
                    IJAA
                  </h1>
                  <Banner size="md" className="hero-banner">
                    AI探索者
                  </Banner>
                </div>
              </div>

              <div className="scroll-cue" aria-hidden="true">
                <span />
                <i />
              </div>
            </div>
          </section>

          <div className="intro-wrapper-spacer" />
          <section className="about-section">
            <div id="about" ref={aboutRef} className="about-spacer" />
          </section>
        </div>

        <section id="projects" ref={projectsRef} className="projects-section">
          <div className="notch notch-start" aria-hidden="true" />
          <div className="notch notch-end" aria-hidden="true" />
          <div className="section-shell projects-shell">
            <div className="projects-title">
              <Banner size="sm" className="projects-banner">
                精选
              </Banner>
              <h2 className="projects-heading">Projects</h2>
            </div>

            <div className="projects-grid">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onHover={() => setHoveredProject(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <div ref={contactRef} className="home-contact">
          <section id="contact" className="contact-section">
            <div className="section-shell contact-shell grid grid-cols-12 gap-4 md:gap-8">
              <div className="contact-links contact-links-social" aria-label="联系方式">
                <SocialLinks />
              </div>
              <div className="contact-copy">
                <h2 className="contact-title">
                  一起做点有
                  <br />
                  意思的产品。
                </h2>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </div>
  )
}
