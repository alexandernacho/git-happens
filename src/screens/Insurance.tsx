import { Button } from '../components/Button'
import { Card, FlowScreen, Option } from '../components/FlowScreen'
import { daysBetween, formatEur, todayIso } from '../lib/format'
import type { Choices } from '../flow'
import type { TripDetection } from '../lib/detectTrip'

type Props = {
  detection: TripDetection
  choice: Choices['insurance']
  onChoose: (c: Choices['insurance']) => void
  progress: { index: number; count: number }
  onBack: () => void
  onNext: () => void
}

// Prices and cover amounts are illustrative for the demo.
const plans = [
  { id: 'single' as const, name: 'This trip only', price: '€24', note: 'up to 14 days' },
  { id: 'annual' as const, name: 'All trips this year', price: '€89', note: 'per year, worldwide' },
]

export function Insurance({ detection, choice, onChoose, progress, onBack, onNext }: Props) {
  const booked = detection.evidence[0]?.transaction.date
  const daysSinceBooking = booked ? daysBetween(booked, todayIso()) : 0
  const selected = choice ?? 'single'

  return (
    <FlowScreen
      title={`Protect your ${formatEur(detection.bookedTotal, true)} trip`}
      progress={progress}
      onBack={onBack}
      footer={
        <>
          <Button
            onClick={() => {
              onChoose(selected)
              onNext()
            }}
          >
            Add travel insurance · {plans.find((p) => p.id === selected)!.price}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onChoose(null)
              onNext()
            }}
          >
            I'm already covered
          </Button>
        </>
      }
    >
      <Card className="mb-4 border-l-4 border-amber-400">
        <p className="text-sm">
          ⏱️ You booked <b>{daysSinceBooking === 1 ? 'yesterday' : `${daysSinceBooking} days ago`}</b>. Cancellation cover usually has to start shortly after
          booking, so now is the right moment.
        </p>
      </Card>

      <Card className="mb-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">KBC Travel Insurance covers</p>
        <ul className="space-y-2 text-sm">
          <li>🏥 Medical costs abroad, including hospital</li>
          <li>❌ Cancellation, up to your {formatEur(detection.bookedTotal, true)} booking</li>
          <li>🧳 Lost or delayed luggage</li>
          <li>📞 24/7 assistance in {detection.destination!.city}</li>
        </ul>
      </Card>

      <div className="space-y-2">
        {plans.map((p) => (
          <Option key={p.id} selected={selected === p.id} onClick={() => onChoose(p.id)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500">{p.note}</p>
              </div>
              <p className="text-lg font-bold text-kbc-navy">{p.price}</p>
            </div>
          </Option>
        ))}
      </div>
    </FlowScreen>
  )
}
