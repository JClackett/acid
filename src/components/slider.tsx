"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  vertical?: boolean
  className?: string
  trackColor?: string
  thumbColor?: string
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  vertical = true,
  className,
  trackColor = "bg-green-400",
  thumbColor = "bg-green-400",
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number.parseFloat(e.target.value))
  }

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn("relative", vertical ? "h-32 w-12" : "h-12 w-32", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className={cn("absolute cursor-pointer opacity-0", vertical ? "-rotate-90 h-full w-full origin-center" : "h-full w-full")}
        style={{
          ...(vertical ? { top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-90deg)" } : {}),
        }}
      />
      <div
        className={cn(
          "absolute rounded-sm border border-gray-700 bg-gray-800",
          vertical ? "left-5 h-full w-2" : "top-5 h-2 w-full",
        )}
      >
        <div
          className={cn("absolute rounded-sm", trackColor)}
          style={
            vertical
              ? { width: "100%", height: `${percentage}%`, bottom: 0 }
              : { height: "100%", width: `${percentage}%`, left: 0 }
          }
        />
        <div
          className={cn("absolute h-3 w-6 rounded-sm border border-gray-700", thumbColor)}
          style={
            vertical
              ? {
                  bottom: `calc(${percentage}% - 1.5px)`,
                  left: "-8px",
                }
              : {
                  left: `calc(${percentage}% - 1.5px)`,
                  top: "-8px",
                }
          }
        />
      </div>
    </div>
  )
}
