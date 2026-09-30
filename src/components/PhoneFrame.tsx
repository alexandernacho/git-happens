import type { ReactNode } from 'react'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[844px] w-[390px] shrink-0 overflow-hidden rounded-[48px] border-[10px] border-black bg-kbc-bg shadow-2xl">
      <div className="absolute top-2 left-1/2 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
      <StatusBar />
      <div className="relative h-[calc(100%-44px)] overflow-y-auto">{children}</div>
    </div>
  )
}

function StatusBar() {
  const time = new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex h-11 items-center justify-between bg-kbc-navy px-7 text-xs font-semibold text-white">
      <span>{time}</span>
      <span>5G ▮▮▮ 87%</span>
    </div>
  )
}
