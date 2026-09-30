import { KbcHeader } from '../components/KbcHeader'
import { balance, transactions } from '../data/transactions'
import { formatDay, formatEur } from '../lib/format'

export function Home() {
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
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
          {recent.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3">
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
