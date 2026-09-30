import { useState } from 'react'
import { PhoneFrame } from './components/PhoneFrame'
import { Home } from './screens/Home'

// Demo flow: home → trip detected → insurance → destination → budget → currency → eSIM → trip ready.
// Screens are added one issue at a time.
type Step = 'home'

export default function App() {
  const [step] = useState<Step>('home')

  return <PhoneFrame>{step === 'home' && <Home />}</PhoneFrame>
}
