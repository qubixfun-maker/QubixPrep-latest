"use client"
// PDF-style reader. The content is laid out as a fixed-width page (always the full desktop layout), then scaled down to fit
// the screen width, exactly like a PDF in a viewer. No buttons: pinch with two fingers to zoom in (up to 5x), drag to move around.
// (The app locks the browser's own pinch-zoom, so zoom is handled here.)
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react"

export const PAGE_W = 680
const MAX_ZOOM = 5

function scrollParent(el: HTMLElement | null): HTMLElement {
  let n = el?.parentElement || null
  while (n) {
    const oy = getComputedStyle(n).overflowY
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) return n
    n = n.parentElement
  }
  return (document.scrollingElement || document.documentElement) as HTMLElement
}

export function ZoomReader({ children, badge }: { children: ReactNode; badge?: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)   // horizontal pan container (width = screen)
  const sizerRef = useRef<HTMLDivElement>(null)  // takes the scaled size so scrolling works
  const pageRef = useRef<HTMLDivElement>(null)   // the fixed-width page, scaled with transform
  const st = useRef({ fit: 0, scale: 1, h: 0 })

  const apply = (scale: number) => {
    const sizer = sizerRef.current, page = pageRef.current
    if (!sizer || !page) return
    st.current.scale = scale
    page.style.transform = `scale(${scale})`
    sizer.style.width = `${PAGE_W * scale}px`
    sizer.style.height = `${st.current.h * scale}px`
  }

  // fit to width, and keep fitting when the screen or the content size changes
  useLayoutEffect(() => {
    const wrap = wrapRef.current, page = pageRef.current
    if (!wrap || !page) return
    const measure = () => {
      const fit = Math.min(1.6, wrap.clientWidth / PAGE_W)
      if (!fit) return
      // keep the user's zoom (as a multiple of the fit size) when the screen or the content size changes
      const ratio = st.current.fit ? Math.max(1, st.current.scale / st.current.fit) : 1
      st.current.fit = fit
      st.current.h = page.offsetHeight
      apply(fit * ratio)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap); ro.observe(page)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // two-finger pinch around the midpoint of the fingers
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let startDist = 0, startScale = 1
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onStart = (e: TouchEvent) => { if (e.touches.length === 2) { startDist = dist(e.touches); startScale = st.current.scale } }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !startDist) return
      e.preventDefault()
      const { fit, scale } = st.current
      const next = Math.min(fit * MAX_ZOOM, Math.max(fit, startScale * (dist(e.touches) / startDist)))
      if (Math.abs(next - scale) < 0.001) return
      const rect = wrap.getBoundingClientRect()
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
      const sp = scrollParent(wrap)
      const cx = (wrap.scrollLeft + mx) / scale
      const cy = my / scale  // page point under the fingers, measured from the top of the page (page top = wrap top)
      apply(next)
      wrap.scrollLeft = cx * next - mx
      // keep the same page point under the fingers vertically
      const delta = cy * next - cy * scale
      sp.scrollTop += delta
    }
    const onEnd = (e: TouchEvent) => { if (e.touches.length < 2) startDist = 0 }
    wrap.addEventListener("touchstart", onStart, { passive: true })
    wrap.addEventListener("touchmove", onMove, { passive: false })
    wrap.addEventListener("touchend", onEnd)
    return () => { wrap.removeEventListener("touchstart", onStart); wrap.removeEventListener("touchmove", onMove); wrap.removeEventListener("touchend", onEnd) }
  }, [])

  return (
    <div className="w-full bg-slate-200 py-2">
      {badge && <div className="qp-no-print mb-2 flex justify-center">{badge}</div>}
      <div ref={wrapRef} className="w-full overflow-x-auto overflow-y-hidden" style={{ touchAction: "pan-x pan-y", WebkitOverflowScrolling: "touch" }}>
        <div ref={sizerRef} style={{ margin: "0 auto" }}>
          <div ref={pageRef} style={{ width: PAGE_W, transformOrigin: "top left", background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.18)" }}>{children}</div>
        </div>
      </div>
    </div>
  )
}
