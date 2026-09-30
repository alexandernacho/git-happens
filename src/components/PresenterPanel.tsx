import { useMemo } from 'react'
import { transactions } from '../data/transactions'
import { stepLabels, type Step } from '../flow'
import { detectTrip, type TripDetection } from '../lib/detectTrip'

type Props = {
  detection: TripDetection
  steps: Step[]
  step: Step
  onJump: (s: Step) => void
  onReset: () => void
}

const KBC_CUSTOMERS = 2_300_000

// Shown next to the phone on a wide screen: what the engine did, and how it scales.
// Doubles as a remote control for the presenter (jump to any step, restart the demo).
export function PresenterPanel({ detection, steps, step, onJump, onReset }: Props) {
  const perCustomerMs = useMemo(() => {
    const runs = 300
    const start = performance.now()
    for (let i = 0; i < runs; i++) detectTrip(transactions)
    return (performance.now() - start) / runs
  }, [])
  const minutesForAll = (perCustomerMs * KBC_CUSTOMERS) / 60_000

  return (
    <aside className="hidden w-80 space-y-5 text-sm text-slate-300 xl:block">
      <div>
        <p className="text-xs font-semibold tracking-widest text-kbc-blue uppercase">Behind the scenes</p>
        <h2 className="mt-1 text-xl font-bold text-white">Trip detection engine</h2>
      </div>

      <div className="rounded-2xl bg-white/5 p-4">
        <Stat label="Card payments scanned" value={String(detection.scanned)} />
        <Stat label="Travel signals (MCC rules)" value={String(detection.evidence.length)} />
        <Stat label="Confidence" value={`${Math.round(detection.confidence * 100)}%`} />
        <Stat label="Time per customer" value={`${perCustomerMs.toFixed(2)} ms`} />
        <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs">
          {detection.evidence.map((e) => (
            <li key={e.transaction.id}>
              <span className="font-mono text-kbc-blue">MCC {e.transaction.mcc}</span> {e.transaction.description}
            </li>
          ))}
          {detection.pastTrip && (
            <li className="text-slate-400">
              + past trip: {detection.pastTrip.destination.city}, €{Math.round(detection.pastTrip.dailySpend)}/day → personal budget
            </li>
          )}
        </ul>
      </div>

      <div className="rounded-2xl bg-kbc-blue/15 p-4 ring-1 ring-kbc-blue/30">
        <p className="text-xs text-slate-400">At KBC scale</p>
        <p className="text-lg font-bold text-white">
          {KBC_CUSTOMERS.toLocaleString('en')} customers in ~{Math.max(1, Math.round(minutesForAll))} min
        </p>
        <p className="text-xs text-slate-400">
          Estimate: measured time for this customer × all customers, one laptop core. Rules run on data KBC already
          has, no extra data needed.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">Demo flow</p>
        <ol className="space-y-1">
          {(['home', ...steps] as Step[]).map((s) => (
            <li key={s}>
              <button
                onClick={() => onJump(s)}
                className={`w-full rounded-lg px-3 py-1.5 text-left ${s === step ? 'bg-white/10 font-semibold text-white' : 'hover:bg-white/5'}`}
              >
                {stepLabels[s]}
              </button>
            </li>
          ))}
        </ol>
        <button onClick={onReset} className="mt-3 text-xs text-slate-500 underline hover:text-slate-300">
          Restart demo
        </button>
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}
