import { siteMeta } from '../content/site'

export function Footer() {
  return (
    <footer className="footer-bar">
      <div className="section-shell footer-inner">
        <p>© {new Date().getFullYear()} {siteMeta.title}</p>
        <div className="footer-credit-group">
          <p>
            原始创意与 3D 资产参考自{' '}
            <a href={siteMeta.originalPortfolioHref} target="_blank" rel="noreferrer">
              David Heckhoff
            </a>
          </p>
          <p>
            React 移植基于{' '}
            <a href={siteMeta.originalRepoHref} target="_blank" rel="noreferrer">
              portfolio-2025
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
