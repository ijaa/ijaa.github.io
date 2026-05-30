export const siteMeta = {
  brand: 'IJAA',
  title: 'IJAA.AI',
  email: 'kailiu2013@gmail.com',
  emailHref: 'mailto:kailiu2013@gmail.com',
  githubHref: 'https://github.com/ijaa',
  originalPortfolioHref: 'https://david-hckh.com',
  originalRepoHref: 'https://github.com/davidhckh/portfolio-2025',
} as const

export const socialLinks = [
  {
    id: 'mail',
    label: '发送邮件',
    href: siteMeta.emailHref,
  },
  {
    id: 'github',
    label: '访问 GitHub',
    href: siteMeta.githubHref,
  },
] as const
