import { useState } from 'react'
import { Button } from '../components/Button'
import { Card, FlowScreen, Option } from '../components/FlowScreen'
import type { Destination } from '../data/destinations'
import type { Choices } from '../flow'
import type { TripBudget } from '../lib/budget'
import { formatEur, formatMoney } from '../lib/format'

type Props = {
  destination: Destination
  budget: TripBudget
  onChoose: (cash: Choices['cash']) => void
  progress: { index: number; count: number }
  onBack: () => void
  onNext: () => void
}

const pickups = ['KBC Leuven Ladeuzeplein', 'Home delivery (2 working days)']

export function Currency({ destination, budget, onChoose, progress, onBack, onNext }: Props) {
  // Suggest cash for about a quarter of the spending budget; cards cover the rest.
  const suggested = Math.max(100, Math.round((budget.spending * 0.25) / 50) * 50)
  const [eur, setEur] = useState(suggested)
  const [pickup, setPickup] = useState(pickups[0])
  const local = eur * destination.eurRate

  return (
    <FlowScreen
      title={`Get some ${destination.currency} before you go`}
      progress={progress}
      onBack={onBack}
      footer={
        <>
          <Button
            onClick={() => {
              onChoose({ eur, pickup })
              onNext()
            }}
          >
            Order {formatMoney(local, destination.currency)} for {formatEur(eur, true)}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onChoose(null)
              onNext()
            }}
          >
            I'll only pay by card
          </Button>
        </>
      }
    >
      <Card className="mb-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-slate-500">Today's rate</p>
          <p className="text-sm font-semibold">
            1 EUR = {destination.eurRate} {destination.currency}
          </p>
        </div>
        <p className="mt-4 text-center text-4xl font-bold text-kbc-navy">{formatMoney(local, destination.currency)}</p>
        <p className="text-center text-sm text-slate-500">{formatEur(eur, true)}</p>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={eur}
          onChange={(e) => setEur(Number(e.target.value))}
          className="mt-4 w-full accent-kbc-blue"
        />
        <p className="mt-1 text-xs text-slate-500">
          💡 We suggest {formatEur(suggested, true)}: about a quarter of your spending budget, for tips, taxis and
          small shops. Pay by card for the rest.
        </p>
      </Card>

      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Get it</p>
      <div className="space-y-2">
        {pickups.map((p) => (
          <Option key={p} selected={pickup === p} onClick={() => setPickup(p)}>
            <p className="text-sm font-medium">{p}</p>
          </Option>
        ))}
      </div>
    </FlowScreen>
  )
}
