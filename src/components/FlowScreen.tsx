import type { ReactNode } from 'react'
import { KbcHeader } from './KbcHeader'

type Props = {
  title: string
  progress: { index: number; count: number }
  onBack: () => void
  children: ReactNode
  footer: ReactNode
}

export function FlowScreen({ title, progress, onBack, children, footer }: Props) {
  return (
    <div className="flex min-h-full flex-col">
      <KbcHeader title="Travel assistant" onBack={onBack} />
      <div className="flex gap-1 bg-kbc-navy px-5 pb-3">
        {Array.from({ length: progress.count }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= progress.index ? 'bg-kbc-blue' : 'bg-white/20'}`} />
        ))}
      </div>
      <main className="flex-1 px-5 pt-5 pb-4">
        <h1 className="mb-4 text-2xl leading-tight font-bold text-kbc-navy">{title}</h1>
        {children}
      </main>
      <footer className="sticky bottom-0 space-y-2 border-t border-slate-200 bg-kbc-bg/95 px-5 pt-3 pb-6 backdrop-blur">
        {footer}
      </footer>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>{children}</div>
}

export function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-2 transition ${selected ? 'ring-kbc-blue' : 'ring-transparent hover:ring-slate-200'}`}
    >
      {children}
    </button>
  )
}
