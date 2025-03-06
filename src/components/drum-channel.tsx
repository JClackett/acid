"use client"

import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { Knob } from "./knob"
import { Slider } from "./slider"

interface DrumChannelProps {
  id: string
  name: string
  params: Record<string, number>
  onParamChange: (param: string, value: number) => void
  isActive: boolean
  onTrackSelect: () => void
  className?: string
}

export function DrumChannel({ id, name, params, onParamChange, isActive, onTrackSelect, className }: DrumChannelProps) {
  const renderControls = useMemo(() => {
    switch (id) {
      case "bd": // Bass Drum
        return (
          <div className="grid w-full grid-cols-2 gap-4">
            <Knob value={params.tune || 0.5} onChange={(value) => onParamChange("tune", value)} label="TUNE" size="sm" />
            <Knob value={params.attack || 0.5} onChange={(value) => onParamChange("attack", value)} label="ATTACK" size="sm" />
            <Knob value={params.comp || 0.5} onChange={(value) => onParamChange("comp", value)} label="COMP" size="sm" />
            <Knob value={params.decay || 0.5} onChange={(value) => onParamChange("decay", value)} label="DECAY" size="sm" />
          </div>
        )
      case "sd": // Snare Drum
        return (
          <div className="grid w-full grid-cols-2 gap-4">
            <Knob value={params.tune || 0.5} onChange={(value) => onParamChange("tune", value)} label="TUNE" size="sm" />
            <Knob value={params.snappy || 0.5} onChange={(value) => onParamChange("snappy", value)} label="SNAPPY" size="sm" />
            <Knob value={params.comp || 0.5} onChange={(value) => onParamChange("comp", value)} label="COMP" size="sm" />
            <Knob value={params.decay || 0.5} onChange={(value) => onParamChange("decay", value)} label="DECAY" size="sm" />
          </div>
        )
      default: // All other drums
        return (
          <div className="grid w-full grid-cols-1 gap-4">
            <Knob value={params.tune || 0.5} onChange={(value) => onParamChange("tune", value)} label="TUNE" size="sm" />
            <Knob value={params.decay || 0.5} onChange={(value) => onParamChange("decay", value)} label="DECAY" size="sm" />
          </div>
        )
    }
  }, [id, params, onParamChange])

  return (
    <div className={cn("col-span-1 flex flex-col items-center gap-2", className, (id === "bd" || id === "sd") && "col-span-2")}>
      <div className="flex w-full items-center justify-center rounded-sm bg-neutral-800 py-1 text-center font-bold text-white text-xxs leading-tight">
        {name}
      </div>
      {renderControls}
      <Slider value={params.level || 0.7} onChange={(value) => onParamChange("level", value)} className="mt-2" />
      <div>
        <p>{id.toUpperCase()}</p>
        <button
          type="button"
          onClick={onTrackSelect}
          className={cn(
            "h-6 w-10 rounded-sm font-bold text-xs transition-colors",
            isActive ? "bg-green-500 text-black" : "bg-neutral-800 text-white hover:bg-neutral-700",
          )}
        />
      </div>
    </div>
  )
}
