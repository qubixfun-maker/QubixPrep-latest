import type { ReactNode } from "react"

export const H = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-6 text-lg font-bold text-foreground">{children}</h2>
)
export const P = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
)
export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">{children}</ul>
)
export const Warn = ({ children }: { children: ReactNode }) => (
  <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm leading-relaxed text-foreground">{children}</div>
)
