import { useState } from 'react'
import { Button } from '../components/Button'
import { Card, FlowScreen, Option } from '../components/FlowScreen'
import type { Destination } from '../data/destinations'
import type { EsimPlan } from '../flow'
import { formatEur } from '../lib/format'

type Props = {
  destination: Destination
  days: number
  onChoose: (plan: EsimPlan | null) => void
  progress: { index: number; count: number }
  onBack: () => void
  onNext: () => void
}

// Illustrative partner plans.
const plans: EsimPlan[] = [
  { id: '3gb', data: '3 GB', validity: '7 days', price: 9 },
  { id: '10gb', data: '10 GB', validity: '15 days', price: 19 },
  { id: '20gb', data: '20 GB', validity: '30 days', price: 29 },
]

export function Esim({ destination, days, onChoose, progress, onBack, onNext }: Props) {
  const recommended = days <= 4 ? plans[0] : days <= 15 ? plans[1] : plans[2]
  const [selected, setSelected] = useState(recommended)
  const [installed, setInstalled] = useState(false)

  if (installed) {
    return (
      <FlowScreen
        title="Your eSIM is ready"
        progress={progress}
        onBack={() => setInstalled(false)}
        footer={<Button onClick={onNext}>Continue</Button>}
      >
        <Card className="flex flex-col items-center text-center">
          <FakeQr />
          <p className="mt-4 text-sm font-semibold">
            {selected.data} · {destination.country}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Scan with your phone camera, or tap <b>Install</b>. It switches on when you land, so you won't pay anything
            before your trip.
          </p>
        </Card>
      </FlowScreen>
    )
  }

  return (
    <FlowScreen
      title={`Stay online in ${destination.city} 📶`}
      progress={progress}
      onBack={onBack}
      footer={
        <>
          <Button
            onClick={() => {
              onChoose(selected)
              setInstalled(true)
            }}
          >
            Get {selected.data} eSIM · {formatEur(selected.price, true)}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onChoose(null)
              onNext()
            }}
          >
            No thanks
          </Button>
        </>
      }
    >
      <Card className="mb-4 border-l-4 border-amber-400">
        <p className="text-sm">
          {destination.country} is outside the EU, so your Belgian plan charges roaming there. An eSIM gives you local
          data at a fixed price.
        </p>
      </Card>
      <div className="space-y-2">
        {plans.map((p) => (
          <Option key={p.id} selected={selected.id === p.id} onClick={() => setSelected(p)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {p.data}{' '}
                  {p.id === recommended.id && (
                    <span className="ml-1 rounded-full bg-kbc-sky px-2 py-0.5 text-xs font-medium text-kbc-navy">
                      Fits your {days}-day trip
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">Valid {p.validity}</p>
              </div>
              <p className="text-lg font-bold text-kbc-navy">{formatEur(p.price, true)}</p>
            </div>
          </Option>
        ))}
      </div>
    </FlowScreen>
  )
}

// A QR-looking pattern for the mockup. Not a real code.
function FakeQr() {
  const size = 21
  const cells: boolean[] = []
  let seed = 7
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    cells.push(seed % 3 === 0)
  }
  const finder = (x: number, y: number) =>
    [0, size - 7].some((ox) => [0, size - 7].some((oy) => !(ox === size - 7 && oy === size - 7) && x >= ox && x < ox + 7 && y >= oy && y < oy + 7))
  const finderOn = (x: number, y: number) => {
    const fx = x < 7 ? x : x - (size - 7)
    const fy = y < 7 ? y : y - (size - 7)
    return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4)
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44" shapeRendering="crispEdges">
      {cells.map((on, i) => {
        const x = i % size
        const y = Math.floor(i / size)
        const filled = finder(x, y) ? finderOn(x, y) : on
        return filled ? <rect key={i} x={x} y={y} width={1} height={1} fill="#003665" /> : null
      })}
    </svg>
  )
}
