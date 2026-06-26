"use client"

import { useState, useEffect } from "react"
import { Download, X, Share, PlusSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

const DISMISS_KEY = "pwa-install-dismissed-at"
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 // re-show after 24h if not installed

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) return

    const ua = window.navigator.userAgent
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIos(iosDevice)

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e)
      maybeShow()
    }

    function maybeShow() {
      const dismissedAt = localStorage.getItem(DISMISS_KEY)
      if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_COOLDOWN_MS) {
        return
      }
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // iOS has no beforeinstallprompt event — show manual instructions directly
    if (iosDevice) {
      maybeShow()
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setIsVisible(false)
      }
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setIsVisible(false)
  }

  if (isStandalone || !isVisible) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="glass rounded-2xl border border-white/10 shadow-2xl p-4 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary/20 text-primary shrink-0">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Install QubixPrep</p>
          {isIos ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Tap <Share className="h-3 w-3 inline" /> then "Add to Home Screen" <PlusSquare className="h-3 w-3 inline" /> for the full app experience.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Add to your home screen for faster access and offline support.
            </p>
          )}
          {!isIos && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="mt-3 h-8 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90"
            >
              Install App
            </Button>
          )}
        </div>
        <button onClick={handleDismiss} className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
