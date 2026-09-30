import { useEffect, useState } from 'react'
import { KbcHeader } from '../components/KbcHeader'
import { balance, transactions } from '../data/transactions'
import { formatDay, formatEur } from '../lib/format'
import type { TripDetection } from '../lib/detectTrip'

type Props = { detection: TripDetection; notify: boolean; onOpenTrip: () => void }

export function Home({ detection, notify, onOpenTrip }: Props) {
  const [showBanner, setShowBanner] = useState(false)

  // The "push notification" slides in a moment after the app opens, so the audience sees it arrive.
  useEffect(() => {
    if (!notify || !detection.detected) return
    const timer = setTimeout(() => setShowBanner(true), 1500)
    return () => clearTimeout(timer)
  }, [notify, detection.detected])

  const travelIds = new Set(detection.evidence.map((e) => e.transaction.id))

  return (
    <div>
      {detection.destination && (
        <button
          onClick={onOpenTrip}
          className={`absolute inset-x-3 top-3 z-20 flex items-center gap-3 rounded-2xl bg-white/95 p-3 text-left shadow-xl ring-1 ring-black/5 backdrop-blur transition-all duration-500 ${showBanner ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-24 opacity-0'}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kbc-navy text-lg">✈️</span>
          <span className="min-w-0">
            <span className="block text-xs text-slate-500">KBC Mobile · now</span>
            <span className="block text-sm font-semibold">Going to {detection.destination.city}? {detection.destination.flag}</span>
            <span className="block text-xs text-slate-600">Let's get your trip sorted in 2 minutes.</span>
          </span>
        </button>
      )}

      <KbcHeader title="Hi, Sofie" />
      <section className="bg-kbc-navy px-5 pb-6 text-white">
        <p className="text-sm text-white/70">KBC Current Account</p>
        <p className="text-xs text-white/50">BE68 7340 1234 5678</p>
        <p className="mt-3 text-3xl font-bold">{formatEur(balance)}</p>
      </section>

      <nav className="-mt-3 grid grid-cols-4 gap-2 px-4">
        {['Transfer', 'Pay', 'Cards', 'Invest'].map((label) => (
          <div key={label} className="rounded-xl bg-white py-3 text-center text-xs font-medium text-kbc-navy shadow-sm">
            {label}
          </div>
        ))}
      </nav>

      <section className="mt-5 px-4 pb-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Recent transactions</h2>
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
          {transactions.slice(0, 14).map((t) => (
            <li key={t.id} className={`flex items-center justify-between px-4 py-3 ${showBanner && travelIds.has(t.id) ? 'bg-kbc-sky' : ''}`}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.description}</p>
                <p className="text-xs text-slate-400">{formatDay(t.date)}</p>
              </div>
              <span className={`ml-3 shrink-0 text-sm font-semibold ${t.amount > 0 ? 'text-emerald-600' : ''}`}>
                {formatEur(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
