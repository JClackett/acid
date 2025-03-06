"use client"

import type { Step } from "@/lib/sequencer"
import { cn } from "@/lib/utils"
import { memo } from "react"

interface StepSequencerProps {
  steps: Step[]
  currentStep: number
  onStepToggle: (step: number) => void
  className?: string
}

export const StepSequencer = memo(function _StepSequencer({ steps, currentStep, onStepToggle, className }: StepSequencerProps) {
  // Function to get color based on step position
  const getStepColor = (step: number): string => {
    if (step < 4) return "bg-red-500"
    if (step < 8) return "bg-yellow-500"
    if (step < 12) return "bg-lime-400"
    return "bg-neutral-200"
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-16 gap-1">
        {steps.map((step, index) => (
          <button
            type="button"
            key={index}
            className={cn(
              "h-24 w-full rounded-sm border border-neutral-700 transition-colors",
              index === currentStep && "border-white",
              step.active ? getStepColor(index) : "bg-neutral-900",
            )}
            onClick={() => onStepToggle(index)}
          />
        ))}
      </div>
    </div>
  )
})
