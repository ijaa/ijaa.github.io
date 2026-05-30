import clsx from 'clsx'
import type { ReactNode } from 'react'

type BannerProps = {
  children: ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export function Banner({ children, size = 'md', className }: BannerProps) {
  return (
    <span className={clsx('banner-label', size === 'sm' && 'banner-label-sm', className)}>
      <span>{children}</span>
    </span>
  )
}
