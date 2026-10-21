"use client"

import React from "react"

export default class SafeBoundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-600">
        <p className="text-lg font-extrabold text-slate-800">This mind map could not be drawn</p>
        <p className="max-w-sm text-sm">Its data looks unusual. Please tell the QubixPrep team which map it was.</p>
        <p className="max-w-sm break-words rounded-xl bg-slate-100 px-3 py-2 font-mono text-[11px] text-slate-500">{String(this.state.err.message || this.state.err).slice(0, 200)}</p>
        <button onClick={() => location.reload()} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold text-white">Try again</button>
      </div>
    )
  }
}
