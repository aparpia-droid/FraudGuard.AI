interface BadgeProps {
  children: React.ReactNode
  variant?: 'accent' | 'green' | 'yellow' | 'orange' | 'red' | 'neutral'
}

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const colors: Record<string, { bg: string; text: string }> = {
    accent: { bg: '#000', text: '#fff' },
    green: { bg: '#2e7d32', text: '#fff' },
    yellow: { bg: '#f9a825', text: '#fff' },
    orange: { bg: '#e65100', text: '#fff' },
    red: { bg: '#c62828', text: '#fff' },
    neutral: { bg: '#e0e0e0', text: '#000' },
  }
  const c = colors[variant] || colors.neutral
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'var(--font-heading)',
        borderRadius: 'var(--radius)',
        background: c.bg,
        color: c.text,
      }}
    >
      {children}
    </span>
  )
}
