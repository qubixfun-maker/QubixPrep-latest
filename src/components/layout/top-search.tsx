"use client"
import { createContext, useContext, useEffect, useState } from "react"

type Ctx = { query: string; setQuery: (q: string) => void; placeholder: string | null; setPlaceholder: (p: string | null) => void }
const TopSearchContext = createContext<Ctx | null>(null)

export function TopSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("")
  const [placeholder, setPlaceholder] = useState<string | null>(null)
  return <TopSearchContext.Provider value={{ query, setQuery, placeholder, setPlaceholder }}>{children}</TopSearchContext.Provider>
}

export const useTopSearchState = () => useContext(TopSearchContext)

/** A page calls this to make the top-bar search box search that page only. Works like useState for the search text. */
export function useTopSearch(placeholder: string): [string, (q: string) => void] {
  const c = useContext(TopSearchContext)
  const [local, setLocal] = useState("")
  const setP = c?.setPlaceholder
  const setQ = c?.setQuery
  useEffect(() => {
    setP?.(placeholder); setQ?.("")
    return () => { setP?.(null); setQ?.("") }
  }, [placeholder, setP, setQ])
  return c ? [c.query, c.setQuery] : [local, setLocal]
}
