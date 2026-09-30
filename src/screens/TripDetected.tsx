import { Button } from '../components/Button'
import { Card, FlowScreen } from '../components/FlowScreen'
import { formatDay, formatEur } from '../lib/format'
import type { TripDetection } from '../lib/detectTrip'

type Props = {
  detection: TripDetection
  progress: { index: number; count: number }
  onBack: () => void
  onNext: () => void
}

export function TripDetected({ detection, progress, onBack, onNext }: Props) {
  const d = detection.destination!
  return (
    <FlowScreen
      title={`Looks like you're going to ${d.city} ${d.flag}`}
      progress={progress}
      onBack={onBack}
      footer={
        <>
          <Button onClick={onNext}>Yes, help me prepare</Button>
          <Button variant="secondary" onClick={onBack}>
            Not now
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Exciting! We can help with insurance, a budget, cash and mobile data, all in one place.
      </p>

      <Card>
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Why am I seeing this?</p>
        <ul className="space-y-3">
          {detection.evidence.map((e) => (
            <li key={e.transaction.id} className="flex gap-3">
              <span className="text-xl">{e.kind === 'flight' ? '✈️' : '🏨'}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.transaction.description}</p>
                <p className="text-xs text-slate-500">{e.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatEur(-e.transaction.amount)}</p>
                <p className="text-xs text-slate-400">{formatDay(e.transaction.date)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>How sure we are</span>
            <span className="font-semibold text-kbc-navy">{Math.round(detection.confidence * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-kbc-blue" style={{ width: `${detection.confidence * 100}%` }} />
          </div>
        </div>
      </Card>

      <p className="mt-4 flex gap-2 text-xs text-slate-500">
        <span>🔒</span>
        <span>
          Only you see this. We looked at your own card payments inside the app, nothing is shared.{' '}
          <span className="text-kbc-navy underline">Turn off travel tips</span>
        </span>
      </p>
    </FlowScreen>
  )
}
