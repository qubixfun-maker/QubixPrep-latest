/* The QubixPrep shield, used wherever the app shows its logo. */
/* eslint-disable @next/next/no-img-element */
export function BrandMark({ className = "h-10 w-auto" }: { className?: string }) {
  return <img src="/brand/logo-mark-256.png" alt="QubixPrep" className={className} />
}

/* Shield + the two-tone name. "prep" follows the theme so it reads on light and dark screens. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <BrandMark className="h-11 w-auto shrink-0" />
      <span className="truncate font-serif text-[24px] font-bold leading-none tracking-tight">
        <span className="text-[#c9a24f]">Qubix</span>
        <span className="text-foreground">prep</span>
      </span>
    </span>
  )
}
