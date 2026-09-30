import { Button } from '../components/Button'
import { Card, FlowScreen } from '../components/FlowScreen'
import type { Destination } from '../data/destinations'
import type { Choices, TripPlan } from '../flow'
import { daysBetween, formatDay, formatEur, formatMoney, todayIso } from '../lib/format'

type Props = {
  destination: Destination
  plan: TripPlan
  choices: Choices
  progress: { index: number; count: number }
  onBack: () => void
  onDone: () => void
}

export function TripReady({ destination, plan, choices, progress, onBack, onDone }: Props) {
  const daysToGo = Math.max(0, daysBetween(todayIso(), plan.depart))
  const items: { icon: string; label: string; detail: string; done: boolean }[] = [
    {
      icon: '🛡️',
      label: 'Travel insurance',
      detail: choices.insurance === 'annual' ? 'All trips this year' : choices.insurance === 'single' ? 'This trip' : 'Skipped',
      done: !!choices.insurance,
    },
    {
      icon: '💰',
      label: 'Budget',
      detail: choices.budgetPot ? `${formatEur(choices.budgetPot, true)} set aside in “${destination.city}” pot` : 'Budget saved',
      done: true,
    },
    destination.inEU
      ? { icon: '💶', label: 'Currency', detail: `${destination.country} uses the euro, nothing to exchange`, done: true }
      : {
          icon: '💵',
          label: 'Currency',
          detail: choices.cash
            ? `${formatMoney(choices.cash.eur * destination.eurRate, destination.currency)} · ${choices.cash.pickup}`
            : 'Card only',
          done: !!choices.cash,
        },
    destination.inEU
      ? { icon: '📶', label: 'Mobile data', detail: 'EU roaming, no extra cost', done: true }
      : { icon: '📶', label: 'eSIM', detail: choices.esim ? `${choices.esim.data} · activates on arrival` : 'Skipped', done: !!choices.esim },
  ]

  return (
    <FlowScreen
      title={`You're ready for ${destination.city} ${destination.flag}`}
      progress={progress}
      onBack={onBack}
      footer={<Button onClick={onDone}>Back to home</Button>}
    >
      <div className="mb-4 rounded-2xl bg-kbc-navy p-4 text-white shadow-sm">
        <p className="text-sm text-white/70">
          {formatDay(plan.depart)} – {formatDay(plan.return)}
        </p>
        <p className="text-3xl font-bold">{daysToGo} days to go</p>
      </div>

      <Card>
        <ul className="divide-y divide-slate-100">
          {items.map((i) => (
            <li key={i.label} className="flex items-center gap-3 py-3">
              <span className="text-xl">{i.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{i.label}</p>
                <p className="text-xs text-slate-500">{i.detail}</p>
              </div>
              <span className={`text-lg ${i.done ? 'text-emerald-600' : 'text-slate-300'}`}>{i.done ? '✓' : '–'}</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-center text-xs text-slate-500">🔔 We'll remind you 2 days before you leave.</p>
    </FlowScreen>
  )
}
