"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useCallback, useEffect, useRef, useState } from "react"

interface KnobProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

export function Knob({ value, onChange, min = 0, max = 1, step = 0.01, size = "md", label, className }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false)
  const knobRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const startValueRef = useRef<number>(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startYRef.current = e.clientY
      startValueRef.current = value
    },
    [value],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const deltaY = startYRef.current - e.clientY
      const range = max - min
      const deltaValue = (deltaY / 100) * range

      let newValue = startValueRef.current + deltaValue
      newValue = Math.max(min, Math.min(max, newValue))

      // Round to step
      newValue = Math.round(newValue / step) * step

      onChange(newValue)
    },
    [isDragging, onChange, min, max, step],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    } else {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseUp, handleMouseMove])

  // Calculate rotation based on value
  const rotation = ((value - min) / (max - min)) * 270 - 135

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        ref={knobRef}
        className={cn("relative cursor-pointer rounded-full border-2 border-gray-700 bg-black", sizeClasses[size])}
        onMouseDown={handleMouseDown}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute w-1 rounded-full bg-green-400"
          style={{
            height: size === "sm" ? "30%" : size === "md" ? "40%" : "50%",
            bottom: "50%",
            left: "50%",
            transformOrigin: "bottom center",
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        />
      </div>
      {label && <div className="mt-1 text-white text-xs">{label}</div>}
    </div>
  )
}
