import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const styles =
    variant === 'primary'
      ? 'bg-kbc-blue text-white hover:brightness-95'
      : 'bg-white text-kbc-navy ring-1 ring-kbc-navy/20 hover:bg-kbc-sky'
  return (
    <button
      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${styles} ${className}`}
      {...props}
    />
  )
}
