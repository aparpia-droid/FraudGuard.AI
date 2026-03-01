import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  primary?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

export default function Button({
  children,
  primary = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        padding: '10px 20px',
        fontSize: 15,
        fontWeight: 600,
        fontFamily: 'var(--font-heading)',
        borderRadius: 'var(--radius)',
        border: primary ? 'none' : 'var(--border)',
        background: primary ? 'var(--accent)' : 'transparent',
        color: primary ? '#fff' : 'var(--text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseOver={(e) => {
        if (disabled) return
        if (primary) e.currentTarget.style.background = 'var(--accent-hover)'
        else e.currentTarget.style.background = '#f5f5f5'
      }}
      onMouseOut={(e) => {
        if (primary) e.currentTarget.style.background = 'var(--accent)'
        else e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
