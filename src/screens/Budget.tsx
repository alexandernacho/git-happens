import { Button } from '../components/Button'
import { Card, FlowScreen } from '../components/FlowScreen'
import type { Destination } from '../data/destinations'
import { balance } from '../data/transactions'
import type { TripBudget } from '../lib/budget'
import { formatEur } from '../lib/format'
import { useBudgetTip } from '../lib/useBudgetTip'

type Props = {
  destination: Destination
  budget: TripBudget
  pot: number | null
  onPot: (eur: number | null) => void
  progress: { index: number; count: number }
  onBack: () => void
  onNext: () => void
}

export function Budget({ destination, budget, pot, onPot, progress, onBack, onNext }: Props) {
  const tip = useBudgetTip(destination, budget)
  const maxBar = Math.max(...budget.breakdown.map((b) => b.amount))

  return (
    <FlowScreen
      title={`Your ${destination.city} budget`}
      progress={progress}
      onBack={onBack}
      footer={
        <>
          <Button
            onClick={() => {
              onPot(budget.spending)
              onNext()
            }}
          >
            Set aside {formatEur(budget.spending, true)} in a “{destination.city}” pot
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onPot(pot)
              onNext()
            }}
          >
            Just show me the budget
          </Button>
        </>
      }
    >
      <Card className="mb-3">
        <p className="text-4xl font-bold text-kbc-navy">
          {formatEur(budget.daily, true)}
          <span className="text-base font-medium text-slate-500"> / day</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">{budget.basis}</p>
        <div className="mt-4 space-y-2">
          {budget.breakdown.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">{b.label}</span>
                <span className="font-semibold">{formatEur(b.amount, true)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-kbc-blue" style={{ width: `${(b.amount / maxBar) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-3 text-sm">
        <Row label="Flight + hotel (paid)" value={formatEur(budget.prepaid, true)} />
        <Row label={`Spending, ${budget.days} days × ${formatEur(budget.daily, true)}`} value={formatEur(budget.spending, true)} />
        <div className="my-2 border-t border-slate-100" />
        <Row label="Whole trip" value={formatEur(budget.total, true)} bold />
        <p className="mt-2 text-xs text-emerald-700">
          ✓ Your balance of {formatEur(balance, true)} covers the rest of the trip.
        </p>
      </Card>

      <Card className="bg-gradient-to-br from-kbc-sky to-white">
        <p className="mb-1 text-xs font-semibold tracking-wide text-kbc-navy uppercase">
          {tip?.source === 'fallback' ? '💡 Tip' : '✨ Personal tip'}
        </p>
        {tip ? (
          <p className="text-sm text-slate-700">{tip.text}</p>
        ) : (
          <div className="space-y-2 py-1">
            <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
          </div>
        )}
      </Card>
    </FlowScreen>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? 'font-bold text-kbc-navy' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
