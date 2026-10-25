"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { School } from "lucide-react"
import { searchColleges } from "@/lib/college-search"

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}

/** Type-ahead picker for every medical college in India. A student whose college is missing can keep what they typed. */
export function CollegePicker({ value, onChange, placeholder = "Search your medical college", required }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const hits = useMemo(() => searchColleges(value), [value])
  const typed = value.trim()
  const exact = hits.some((h) => h.label.toLowerCase() === typed.toLowerCase())
  const showCustom = typed.length >= 2 && !exact

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  useEffect(() => setActive(0), [value])

  const pick = (label: string) => {
    onChange(label)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setOpen(true); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === "Enter" && open && hits[active]) { e.preventDefault(); pick(hits[active].label) }
    else if (e.key === "Escape") setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (hits.length > 0 || showCustom) && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
          {hits.map((h, i) => (
            <button
              type="button"
              key={`${h.label}-${h.state}-${i}`}
              onMouseDown={(e) => { e.preventDefault(); pick(h.label) }}
              onMouseEnter={() => setActive(i)}
              className={`block w-full px-3 py-2 text-left text-sm ${i === active ? "bg-accent" : ""}`}
            >
              <span className="block font-medium leading-snug">{h.name}</span>
              <span className="block text-xs text-muted-foreground">{h.city}, {h.state}</span>
            </button>
          ))}
          {showCustom && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(typed) }}
              className="block w-full border-t px-3 py-2 text-left text-sm text-primary hover:bg-accent"
            >
              My college isn&apos;t listed — use &ldquo;{typed}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
