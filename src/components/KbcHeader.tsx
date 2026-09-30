export function KbcHeader({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <header className="flex items-center gap-3 bg-kbc-navy px-5 pt-2 pb-4 text-white">
      {onBack && (
        <button onClick={onBack} className="-ml-1 px-1 text-3xl leading-none" aria-label="Back">
          ‹
        </button>
      )}
      <span className="text-xl font-bold tracking-tight">
        KBC<span className="text-kbc-blue">.</span>
      </span>
      {title && <span className="ml-auto text-sm text-white/80">{title}</span>}
    </header>
  )
}
