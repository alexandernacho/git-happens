import { useMemo, useState } from 'react'
import { PhoneFrame } from './components/PhoneFrame'
import { PresenterPanel } from './components/PresenterPanel'
import { destinationById } from './data/destinations'
import { transactions } from './data/transactions'
import { emptyChoices, flowSteps, isoInDays, tripDays, type Choices, type Step, type TripPlan } from './flow'
import { planBudget } from './lib/budget'
import { detectTrip } from './lib/detectTrip'
import { Budget } from './screens/Budget'
import { Currency } from './screens/Currency'
import { DestinationScreen } from './screens/DestinationScreen'
import { Esim } from './screens/Esim'
import { Home } from './screens/Home'
import { Insurance } from './screens/Insurance'
import { TripDetected } from './screens/TripDetected'
import { TripReady } from './screens/TripReady'

const detection = detectTrip(transactions)
const detectedId = detection.destination?.id ?? 'nyc'
const initialPlan: TripPlan = { destinationId: detectedId, depart: isoInDays(21), return: isoInDays(28) }

export default function App() {
  const [step, setStep] = useState<Step>('home')
  const [notify, setNotify] = useState(true)
  const [plan, setPlan] = useState<TripPlan>(initialPlan)
  const [choices, setChoices] = useState<Choices>(emptyChoices)

  const destination = destinationById(plan.destinationId)
  const steps = flowSteps(destination)
  const days = tripDays(plan)
  const budget = useMemo(
    () => planBudget(destination, days, detection.bookedTotal, detection.pastTrip, transactions),
    [destination, days],
  )

  const index = steps.indexOf(step)
  const progress = { index, count: steps.length }
  const next = () => setStep(steps[index + 1] ?? 'home')
  const back = () => setStep(index <= 0 ? 'home' : steps[index - 1])
  const choose = (patch: Partial<Choices>) => setChoices((c) => ({ ...c, ...patch }))
  const restart = () => {
    setStep('home')
    setNotify(false)
    setPlan(initialPlan)
    setChoices(emptyChoices)
  }

  const screens: Record<Step, React.ReactNode> = {
    home: <Home detection={detection} notify={notify} onOpenTrip={() => setStep('detected')} />,
    detected: (
      <TripDetected
        detection={detection}
        progress={progress}
        onBack={() => {
          setNotify(false)
          setStep('home')
        }}
        onNext={next}
      />
    ),
    insurance: (
      <Insurance
        detection={detection}
        choice={choices.insurance}
        onChoose={(insurance) => choose({ insurance })}
        progress={progress}
        onBack={back}
        onNext={next}
      />
    ),
    destination: (
      <DestinationScreen plan={plan} detectedId={detectedId} onChange={setPlan} progress={progress} onBack={back} onNext={next} />
    ),
    budget: (
      <Budget
        destination={destination}
        budget={budget}
        pot={choices.budgetPot}
        onPot={(budgetPot) => choose({ budgetPot })}
        progress={progress}
        onBack={back}
        onNext={next}
      />
    ),
    currency: (
      <Currency destination={destination} budget={budget} onChoose={(cash) => choose({ cash })} progress={progress} onBack={back} onNext={next} />
    ),
    esim: <Esim destination={destination} days={days} onChoose={(esim) => choose({ esim })} progress={progress} onBack={back} onNext={next} />,
    ready: <TripReady destination={destination} plan={plan} choices={choices} progress={progress} onBack={back} onDone={restart} />,
  }

  return (
    <div className="flex min-h-screen items-center justify-center gap-12 p-6">
      <PhoneFrame key={step}>{screens[step]}</PhoneFrame>
      <PresenterPanel
        detection={detection}
        steps={steps}
        step={step}
        onJump={(s) => setStep(s)}
        onReset={() => {
          restart()
          setNotify(true)
        }}
      />
    </div>
  )
}
