"use client"

import ReactMarkdown from "react-markdown"
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react"
import type { JellyMessage } from "./jelly-store"

export function JellyMessages({ messages, rated, rate, busy }: {
  messages: JellyMessage[]; rated: Record<number, "up" | "down">; rate: (i: number, r: "up" | "down") => void; busy: boolean
}) {
  return (
    <>
      {messages.map((m, i) => {
        const last = i === messages.length - 1
        return (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-primary/20 text-foreground" : "bg-white/5"}`}>
              {m.role === "jelly" && !m.text ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                <div className="prose prose-invert prose-sm max-w-none [&>*]:my-1.5"><ReactMarkdown>{m.text}</ReactMarkdown></div>
              )}
              {m.role === "jelly" && m.text && !(busy && last) && (
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <button aria-label="Helpful" onClick={() => rate(i, "up")} className={`p-0.5 rounded hover:text-emerald-400 ${rated[i] === "up" ? "text-emerald-400" : ""}`}><ThumbsUp className="h-3 w-3" /></button>
                  <button aria-label="Not helpful" onClick={() => rate(i, "down")} className={`p-0.5 rounded hover:text-red-400 ${rated[i] === "down" ? "text-red-400" : ""}`}><ThumbsDown className="h-3 w-3" /></button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
