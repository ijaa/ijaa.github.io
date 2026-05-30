import { Mail, Github } from 'lucide-react'
import { socialLinks } from '../content/site'

const icons = {
  mail: Mail,
  github: Github,
}

type SocialLinksProps = {
  variant?: 'plain' | 'pill'
}

export function SocialLinks({ variant = 'plain' }: SocialLinksProps) {
  return (
    <div className={variant === 'pill' ? 'social-links social-links-pill' : 'social-links'}>
      {socialLinks.map((item) => {
        const Icon = icons[item.id]

        return (
          <a
            key={item.id}
            href={item.href}
            aria-label={item.label}
            data-cursor="circle-white"
            className={variant === 'pill' ? 'social-link social-link-pill' : 'social-link'}
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
          >
            <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
            <span>{item.id === 'mail' ? '邮箱' : 'GitHub'}</span>
          </a>
        )
      })}
    </div>
  )
}
