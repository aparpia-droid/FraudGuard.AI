import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  selected?: boolean
}

export default function Card({ children, className = '', onClick, selected }: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      onClick={onClick}
      className={`card ${className}`.trim()}
      style={{
        padding: 18,
        borderRadius: 'var(--radius)',
        border: 'var(--border)',
        background: selected ? '#f5f5f5' : 'var(--bg-card)',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {children}
    </div>
  )
}
