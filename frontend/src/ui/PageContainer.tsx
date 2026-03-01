import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`page-container ${className}`.trim()} style={{
      maxWidth: 720,
      margin: 0,
      padding: '40px 24px',
    }}>
      {children}
    </div>
  )
}
