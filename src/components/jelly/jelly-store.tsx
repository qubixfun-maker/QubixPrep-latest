"use client"

import { createContext, useContext } from "react"
import type { Mood } from "./JellyAvatar"
import type { Intent, JellyCtx, PersonaId } from "@/lib/jelly/personas"
import { EMPTY_PROFILE, type JellyProfile, type Mode } from "@/lib/jelly/profile"

export type JellyEvent =
  | { type: "answer"; correct: boolean }
  | { type: "finish"; score: number; total: number }
  | { type: "say"; text: string; mood?: Mood }

export type JellyMessage = { role: "user" | "jelly"; text: string }

export type JellyApi = {
  /** true when the student has an active plan */
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
  mode: Mode
  setMode: (m: Mode) => void
  clearChat: () => void
  rated: Record<number, "up" | "down">
  rate: (index: number, rating: "up" | "down") => void
  profile: JellyProfile
  saveProfile: (patch: Partial<JellyProfile>) => void
  removeNote: (index: number) => void
  forgetMe: () => void
  usage: { used: number; limit: number } | null
  voiceOn: boolean
  setVoiceOn: (v: boolean) => void
  speaking: boolean
  stopSpeaking: () => void
  listening: boolean
  interim: string
  micSupported: boolean
  toggleMic: () => void
  conversation: boolean
  setConversation: (v: boolean) => void
  wakeOn: boolean
  setWakeOn: (v: boolean) => void
  wakeSupported: boolean
}

const NOOP: JellyApi = {
  active: false, mood: "idle", persona: "jarvis", setPersona: () => {}, sadOnWrong: false, setSadOnWrong: () => {},
  hidden: false, setHidden: () => {}, open: false, setOpen: () => {}, busy: false, messages: [], hasContext: false,
  bubble: null, dismissBubble: () => {}, setContext: () => {}, react: () => {}, ask: () => {}, name: "Doctor",
  mode: "doubt", setMode: () => {}, clearChat: () => {}, rated: {}, rate: () => {}, profile: EMPTY_PROFILE, saveProfile: () => {},
  removeNote: () => {}, forgetMe: () => {}, usage: null, voiceOn: false, setVoiceOn: () => {}, speaking: false, stopSpeaking: () => {},
  listening: false, interim: "", micSupported: false, toggleMic: () => {}, conversation: false, setConversation: () => {},
  wakeOn: false, setWakeOn: () => {}, wakeSupported: false,
}

export const JellyContext = createContext<JellyApi | null>(null)
/** Safe to call anywhere: outside the provider (or for students without a plan) everything is a no-op. */
export const useJelly = (): JellyApi => useContext(JellyContext) ?? NOOP
