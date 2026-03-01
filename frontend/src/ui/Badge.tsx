interface BadgeProps {
  children: React.ReactNode
  variant?: 'accent' | 'green' | 'yellow' | 'red' | 'neutral'
}

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const colors: Record<string, { bg: string; text: string }> = {
    accent: { bg: '#000', text: '#fff' },
    green: { bg: '#000', text: '#fff' },
    yellow: { bg: '#444', text: '#fff' },
    red: { bg: '#222', text: '#fff' },
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
