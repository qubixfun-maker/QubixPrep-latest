"use client"

import { useSyncExternalStore } from "react"

/**
 * Chrome lets only one speech recognizer run at a time. Anything that wants the microphone calls
 * micAcquire() and calls the returned function when it is done; the always-on "Hey Jelly" listener
 * watches this and steps aside while the microphone is taken.
 */
let holders = 0
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

export function micAcquire(): () => void {
  holders++; emit()
  let done = false
  return () => { if (done) return; done = true; holders = Math.max(0, holders - 1); emit() }
}

export function useMicBusy(): boolean {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb) } },
    () => holders > 0,
    () => false,
  )
}
