interface InputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  label?: string
  id?: string
  className?: string
}

export default function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  label,
  id,
  className = '',
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`
  return (
    <div className={className} style={{ marginBottom: className ? 0 : 20 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 16,
          fontFamily: 'var(--font-body)',
          borderRadius: 'var(--radius)',
          border: 'var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text)',
        }}
      />
    </div>
  )
}
