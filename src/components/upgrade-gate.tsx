"use client"

import { Crown, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UpgradeGateProps {
  type: 'content' | 'ai'
  title?: string
  description?: string
}

export function UpgradeGate({ type, title, description }: UpgradeGateProps) {
  const isAI = type === 'ai'
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 glass rounded-3xl border-2 border-dashed border-white/10">
      <div className={`p-5 rounded-full ${isAI ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
        {isAI ? <Zap className="h-10 w-10" /> : <Crown className="h-10 w-10" />}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">
          {title || (isAI ? 'Clinician Plan Required' : 'Scholar Plan Required')}
        </h3>
        <p className="text-muted-foreground max-w-sm">
          {description || (isAI 
            ? 'Upgrade to Clinician (₹59/mo) to unlock AI Tools, AI Tutor, and PDF Extraction.'
            : 'Upgrade to Scholar (₹29/mo) to unlock the full notes library, all mindmaps, and unlimited QBank.'
          )}
        </p>
      </div>
      <Link href="/pricing">
        <Button className={`h-12 px-8 rounded-xl font-bold gap-2 ${isAI ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30' : 'bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30'}`}>
          <Lock className="h-4 w-4" /> View Plans
        </Button>
      </Link>
    </div>
  )
}
