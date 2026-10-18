"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { X, ChevronLeft, ChevronRight, FlipHorizontal2, Bookmark, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuickCard, CardImageUrls, CardState } from "@/types/quickcards"

interface CardViewerProps {
  cards: QuickCard[]
  index: number
  urls: Record<string, CardImageUrls>
  states: Record<string, CardState>
  onIndexChange: (i: number) => void
  onClose: () => void
  onToggleBookmark: (card: QuickCard) => void
  onToggleRevised: (card: QuickCard) => void
}

export function CardViewer({ cards, index, urls, states, onIndexChange, onClose, onToggleBookmark, onToggleRevised }: CardViewerProps) {
  const card = cards[index]
  const [showBack, setShowBack] = useState(false)
  const [scale, setScale] = useState(1)
  const [imgLoading, setImgLoading] = useState(true)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const openable = useCallback(
    (i: number) => i >= 0 && i < cards.length && urls[cards[i].id] && !urls[cards[i].id].locked,
    [cards, urls]
  )

  const go = useCallback(
    (dir: 1 | -1) => {
      let i = index + dir
      while (i >= 0 && i < cards.length && !openable(i)) i += dir
      if (i >= 0 && i < cards.length) {
        setShowBack(false)
        setScale(1)
        setImgLoading(true)
        onIndexChange(i)
      }
    },
    [index, cards.length, openable, onIndexChange]
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowRight") go(1)
      else if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [go, onClose])

  // Warm the browser cache with the neighbouring cards
  useEffect(() => {
    ;[index - 1, index + 1].forEach((i) => {
      const u = cards[i] && urls[cards[i].id]
      if (u && !u.locked && u.front) {
        const img = new Image()
        img.src = u.front
      }
    })
  }, [index, cards, urls])

  if (!card) return null
  const u = urls[card.id]
  const src = showBack ? u?.back : u?.front
  const hasBack = !!u?.back
  const state = states[card.id] || {}

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) { touchStart.current = null; return }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchEnd(e: React.TouchEvent) {
    const s = touchStart.current
    touchStart.current = null
    // Only swipe between cards when the image is not zoomed in (otherwise the swipe is a pan)
    if (!s || scale > 1.05) return
    const dx = e.changedTouches[0].clientX - s.x
    const dy = e.changedTouches[0].clientY - s.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" role="dialog" aria-label={`${card.cardId} ${card.title}`}>
      <div className="flex items-center gap-2 px-3 py-2 text-white">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10"><X className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{card.title}</p>
          <p className="text-xs text-white/50">{card.cardId} · {index + 1} of {cards.length}{showBack ? " · back" : ""}</p>
        </div>
        {hasBack && (
          <Button variant="ghost" size="sm" onClick={() => { setShowBack((b) => !b); setScale(1); setImgLoading(true) }} className="text-white hover:bg-white/10 gap-1">
            <FlipHorizontal2 className="h-4 w-4" /> {showBack ? "Front" : "Flip"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleBookmark(card)}
          className={`hover:bg-white/10 ${state.bookmarked ? "text-yellow-400" : "text-white"}`}
          aria-label="Bookmark"
        >
          <Bookmark className={`h-5 w-5 ${state.bookmarked ? "fill-yellow-400" : ""}`} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleRevised(card)}
          className={`hover:bg-white/10 gap-1 ${state.revised ? "text-green-400" : "text-white"}`}
        >
          <CheckCircle2 className="h-4 w-4" /> {state.revised ? "Revised" : "Mark revised"}
        </Button>
      </div>

      <div className="relative flex-1 min-h-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {imgLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-8 w-8 animate-spin text-white/60" />
          </div>
        )}
        {src && (
          <TransformWrapper
            key={`${card.id}-${showBack ? "b" : "f"}`}
            minScale={1}
            maxScale={5}
            doubleClick={{ mode: "toggle", step: 2 }}
            onTransform={(_, s) => setScale(s.scale)}
          >
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={src}
                alt={card.title}
                onLoad={() => setImgLoading(false)}
                onError={() => setImgLoading(false)}
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
              />
            </TransformComponent>
          </TransformWrapper>
        )}

        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20"
          aria-label="Previous card"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === cards.length - 1}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20"
          aria-label="Next card"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
