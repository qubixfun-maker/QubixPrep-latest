"use client"

import { createContext, useContext } from "react"
import type { Mood } from "./JellyAvatar"
import type { Intent, JellyCtx, PersonaId } from "@/lib/jelly/personas"

export type JellyEvent =
  | { type: "answer"; correct: boolean }
  | { type: "finish"; score: number; total: number }
  | { type: "say"; text: string; mood?: Mood }

export type JellyMessage = { role: "user" | "jelly"; text: string }

export type JellyApi = {
  /** true when the student has an active plan and Jelly is switched on */
  active: boolean
  mood: Mood
  persona: PersonaId
  setPersona: (p: PersonaId) => void
  sadOnWrong: boolean
  setSadOnWrong: (v: boolean) => void
  hidden: boolean
  setHidden: (v: boolean) => void
  open: boolean
  setOpen: (v: boolean) => void
  busy: boolean
  messages: JellyMessage[]
  hasContext: boolean
  bubble: { text: string; intent?: Intent } | null
  dismissBubble: () => void
  setContext: (c: JellyCtx | null) => void
  react: (e: JellyEvent) => void
  ask: (text: string, intent?: Intent) => void
  name: string
}

const NOOP: JellyApi = {
  active: false, mood: "idle", persona: "jarvis", setPersona: () => {}, sadOnWrong: false, setSadOnWrong: () => {},
  hidden: false, setHidden: () => {}, open: false, setOpen: () => {}, busy: false, messages: [], hasContext: false,
  bubble: null, dismissBubble: () => {}, setContext: () => {}, react: () => {}, ask: () => {}, name: "Doctor",
}

export const JellyContext = createContext<JellyApi | null>(null)
/** Safe to call anywhere: outside the provider (or for students without a plan) everything is a no-op. */
export const useJelly = (): JellyApi => useContext(JellyContext) ?? NOOP
