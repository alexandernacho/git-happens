import { Button } from '../components/Button'
import { Card, FlowScreen } from '../components/FlowScreen'
import { destinationById, destinations } from '../data/destinations'
import type { TripPlan } from '../flow'

type Props = {
  plan: TripPlan
  detectedId: string
  onChange: (plan: TripPlan) => void
  progress: { index: number; count: number }
  onBack: () => void
  onNext: () => void
}

export function DestinationScreen({ plan, detectedId, onChange, progress, onBack, onNext }: Props) {
  const d = destinationById(plan.destinationId)
  return (
    <FlowScreen
      title="Where are you going?"
      progress={progress}
      onBack={onBack}
      footer={<Button onClick={onNext}>Confirm trip</Button>}
    >
      <Card className="mb-4 flex items-center gap-4">
        <span className="text-4xl">{d.flag}</span>
        <div>
          <p className="text-lg font-bold text-kbc-navy">{d.city}</p>
          <p className="text-sm text-slate-500">{d.country}</p>
          {d.id === detectedId && <p className="mt-1 text-xs text-kbc-blue">✓ From your flight booking</p>}
        </div>
      </Card>

      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Somewhere else?</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {destinations.map((x) => (
          <button
            key={x.id}
            onClick={() => onChange({ ...plan, destinationId: x.id })}
            className={`rounded-full px-3 py-1.5 text-sm ring-1 ${x.id === d.id ? 'bg-kbc-navy text-white ring-kbc-navy' : 'bg-white ring-slate-200'}`}
          >
            {x.flag} {x.city}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">When?</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="rounded-2xl bg-white p-3 shadow-sm">
          <span className="block text-xs text-slate-500">Departure</span>
          <input
            type="date"
            value={plan.depart}
            onChange={(e) => onChange({ ...plan, depart: e.target.value })}
            className="w-full text-sm font-semibold outline-none"
          />
        </label>
        <label className="rounded-2xl bg-white p-3 shadow-sm">
          <span className="block text-xs text-slate-500">Return</span>
          <input
            type="date"
            value={plan.return}
            min={plan.depart}
            onChange={(e) => onChange({ ...plan, return: e.target.value })}
            className="w-full text-sm font-semibold outline-none"
          />
        </label>
      </div>
    </FlowScreen>
  )
}
