"use client"

import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function StudyHeatMap() {
  const [mounted, setMounted] = React.useState(false)
  const [data, setData] = React.useState<number[][]>([])

  // Mock data dimensions: 15 weeks x 7 days
  const weeks = Array.from({ length: 15 }, (_, i) => i)
  const days = Array.from({ length: 7 }, (_, i) => i)

  React.useEffect(() => {
    // Generate random levels only on the client to avoid hydration mismatch
    const newData = weeks.map(() => 
      days.map(() => Math.floor(Math.random() * 5))
    )
    setData(newData)
    setMounted(true)
  }, [])

  // Show a static placeholder grid during SSR/Hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-[3px]">
          {weeks.map((week) => (
            <div key={week} className="flex flex-col gap-[3px]">
              {days.map((day) => (
                <div key={day} className="w-3 h-3 rounded-[2px] bg-white/5" />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest px-1">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="w-2 h-2 rounded-[1px] bg-white/5" />
            <div className="w-2 h-2 rounded-[1px] bg-primary/20" />
            <div className="w-2 h-2 rounded-[1px] bg-primary/40" />
            <div className="w-2 h-2 rounded-[1px] bg-primary/70" />
            <div className="w-2 h-2 rounded-[1px] bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-[3px]">
        {weeks.map((week, weekIdx) => (
          <div key={week} className="flex flex-col gap-[3px]">
            {days.map((day, dayIdx) => {
              const level = data[weekIdx]?.[dayIdx] ?? 0
              return (
                <TooltipProvider key={`${week}-${day}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-3 h-3 rounded-[2px] transition-colors duration-300 cursor-pointer",
                          level === 0 && "bg-white/5",
                          level === 1 && "bg-primary/20",
                          level === 2 && "bg-primary/40",
                          level === 3 && "bg-primary/70",
                          level === 4 && "bg-primary"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Study score: {level * 25} points</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest px-1">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-2 h-2 rounded-[1px] bg-white/5" />
          <div className="w-2 h-2 rounded-[1px] bg-primary/20" />
          <div className="w-2 h-2 rounded-[1px] bg-primary/40" />
          <div className="w-2 h-2 rounded-[1px] bg-primary/70" />
          <div className="w-2 h-2 rounded-[1px] bg-primary" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
