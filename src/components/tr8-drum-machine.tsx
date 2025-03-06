"use client"

import { AudioEngine, DrumSounds } from "@/lib/audio-engine"
import { Sequencer, type Track, createDefaultPattern } from "@/lib/sequencer"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import React from "react"
import { DrumChannel } from "./drum-channel"
import { Knob } from "./knob"
import { StepSequencer } from "./step-sequencer"

// Memoize the DrumChannel component to prevent unnecessary re-renders
const MemoizedDrumChannel = React.memo(DrumChannel)

// Memoize the StepSequencer component to prevent unnecessary re-renders
const MemoizedStepSequencer = React.memo(StepSequencer)

export function TR8DrumMachine() {
  const [initialized, setInitialized] = useState(false)
  const [pattern, setPattern] = useState(createDefaultPattern())
  const [currentStep, setCurrentStep] = useState(0)
  const [tempo, setTempo] = useState(128)
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [activeTrackId, setActiveTrackId] = useState("bd")
  const [isPlaying, setIsPlaying] = useState(false)

  const audioEngineRef = useRef<AudioEngine | null>(null)
  const drumSoundsRef = useRef<DrumSounds | null>(null)
  const sequencerRef = useRef<Sequencer | null>(null)
  // Use a ref for current step to avoid unnecessary re-renders
  const currentStepRef = useRef(currentStep)

  // Sync the ref with the state
  useEffect(() => {
    currentStepRef.current = currentStep
  }, [currentStep])

  // Define triggerSound function before it's used in useEffect
  const triggerSound = useCallback((track: Track) => {
    if (!drumSoundsRef.current) return

    const params = track.params

    switch (track.id) {
      case "bd":
        drumSoundsRef.current.triggerBassDrum({
          tune: params.tune || 0.5,
          attack: params.attack || 0.5,
          decay: params.decay || 0.5,
          comp: params.comp || 0.5,
          level: params.level || 0.7,
        })
        break
      case "sd":
        drumSoundsRef.current.triggerSnareDrum({
          tune: params.tune || 0.5,
          snappy: params.snappy || 0.5,
          decay: params.decay || 0.5,
          comp: params.comp || 0.5,
          level: params.level || 0.7,
        })
        break
      case "lt":
        drumSoundsRef.current.triggerLowTom({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "mt":
        drumSoundsRef.current.triggerMidTom({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "ht":
        drumSoundsRef.current.triggerHighTom({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "rs":
        drumSoundsRef.current.triggerRimShot({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "hc":
        drumSoundsRef.current.triggerHandClap({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "ch":
        drumSoundsRef.current.triggerClosedHihat({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "oh":
        drumSoundsRef.current.triggerOpenHihat({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "cc":
        drumSoundsRef.current.triggerCrashCymbal({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
      case "rc":
        drumSoundsRef.current.triggerRideCymbal({
          tune: params.tune || 0.5,
          decay: params.decay || 0.5,
          level: params.level || 0.7,
        })
        break
    }
  }, [])

  // Initialize audio engine and sequencer
  useEffect(() => {
    if (initialized) return

    const audioEngine = new AudioEngine()
    audioEngineRef.current = audioEngine

    const drumSounds = new DrumSounds(audioEngine)
    drumSoundsRef.current = drumSounds

    const sequencer = new Sequencer(pattern)
    sequencerRef.current = sequencer

    sequencer.onStep((step, activeTracks) => {
      // Update the ref immediately
      currentStepRef.current = step

      // Use requestAnimationFrame to batch the state update with other UI updates
      // This reduces the frequency of re-renders
      window.requestAnimationFrame(() => {
        setCurrentStep(step)
      })

      // Trigger sounds for active tracks
      for (const track of activeTracks) {
        triggerSound(track)
      }
    })

    setInitialized(true)

    return () => {
      if (sequencerRef.current?.isRunning()) {
        sequencerRef.current.stop()
      }
    }
  }, [initialized, pattern, triggerSound])

  // Update sequencer when pattern changes
  useEffect(() => {
    if (!sequencerRef.current || !initialized) return

    sequencerRef.current.setPattern(pattern)
  }, [pattern, initialized])

  // Update tempo when it changes
  useEffect(() => {
    if (!sequencerRef.current || !initialized) return

    sequencerRef.current.setTempo(tempo)
  }, [tempo, initialized])

  // Update master volume
  useEffect(() => {
    if (!audioEngineRef.current || !initialized) return

    audioEngineRef.current.getMasterGain().gain.value = masterVolume
  }, [masterVolume, initialized])

  const handleToggleStep = useCallback((trackId: string, step: number) => {
    setPattern((prevPattern) => {
      const newPattern = structuredClone(prevPattern)
      const track = newPattern.tracks.find((t) => t.id === trackId)
      if (track) {
        track.steps[step].active = !track.steps[step].active
      }
      return newPattern
    })
  }, [])

  const handleParamChange = useCallback((trackId: string, param: string, value: number) => {
    setPattern((prevPattern) => {
      const newPattern = structuredClone(prevPattern)
      const track = newPattern.tracks.find((t) => t.id === trackId)
      if (track) {
        track.params[param] = value
      }
      return newPattern
    })
  }, [])

  const handlePlayStop = useCallback(() => {
    if (!sequencerRef.current || !audioEngineRef.current) return

    if (sequencerRef.current.isRunning()) {
      sequencerRef.current.stop()
      setCurrentStep(0)
      setIsPlaying(false)
    } else {
      audioEngineRef.current.resume().then(() => {
        sequencerRef.current?.start()
        setIsPlaying(true)
      })
    }
  }, [])

  const handleClear = useCallback(() => {
    setPattern(createDefaultPattern())
    if (sequencerRef.current?.isRunning()) {
      sequencerRef.current.stop()
      setCurrentStep(0)
      setIsPlaying(false)
    }
  }, [])

  const handleTrackSelect = useCallback((trackId: string) => {
    setActiveTrackId(trackId)
  }, [])

  // Memoize the active track's steps to prevent unnecessary re-renders
  const activeTrackSteps = useMemo(() => {
    return pattern.tracks.find((t) => t.id === activeTrackId)?.steps || []
  }, [pattern, activeTrackId])

  // Memoize the step toggle handler for the active track
  const handleActiveTrackStepToggle = useCallback(
    (step: number) => {
      handleToggleStep(activeTrackId, step)
    },
    [activeTrackId, handleToggleStep],
  )

  // Memoize the tracks array to prevent unnecessary re-renders
  const memoizedTracks = useMemo(() => pattern.tracks, [pattern])

  // Create a memoized map of track param change handlers
  const trackParamChangeHandlers = useMemo(() => {
    const handlers: Record<string, (param: string, value: number) => void> = {}
    memoizedTracks.forEach((track) => {
      handlers[track.id] = (param: string, value: number) => handleParamChange(track.id, param, value)
    })
    return handlers
  }, [memoizedTracks, handleParamChange])

  // Create a memoized map of track select handlers
  const trackSelectHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {}
    memoizedTracks.forEach((track) => {
      handlers[track.id] = () => handleTrackSelect(track.id)
    })
    return handlers
  }, [memoizedTracks, handleTrackSelect])

  return (
    <div className="mx-auto w-full rounded-lg border-4 border-green-500 bg-neutral-900 p-8 shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="font-bold text-2xl text-white">Roland</div>
        <div className="text-white text-xl">RHYTHM PERFORMER TR-8</div>
      </div>

      <div className="flex">
        {/* Left Side Controls - Volume */}
        <div className="mr-6 flex flex-col items-center border-neutral-700 border-r pr-6">
          <div className="mb-6 flex flex-col items-center">
            <Knob value={masterVolume} onChange={setMasterVolume} size="lg" label="VOLUME" />
          </div>

          {/* Transport controls moved to bottom */}
          <div className="mt-auto flex flex-col items-center">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm bg-neutral-700 px-3 py-3 font-bold text-sm text-white hover:bg-neutral-600"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={handlePlayStop}
                className={cn(
                  "w-[100px] rounded-sm px-4 py-3 font-bold text-white",
                  isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700",
                )}
              >
                {isPlaying ? "STOP" : "START"}
              </button>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="flex-1">
          {/* Global Controls */}
          <div className="mb-6 flex justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <Knob value={0.5} onChange={() => {}} size="lg" label="ACCENT" />
              </div>

              <div className="flex flex-col items-center">
                <Knob value={0.3} onChange={() => {}} size="lg" label="REVERB" />
              </div>

              <div className="flex flex-col items-center">
                <Knob value={0.2} onChange={() => {}} size="lg" label="DELAY" />
              </div>
            </div>
          </div>

          {/* Drum Channels - Increased spacing */}
          <div className="mb-6 grid grid-cols-13 gap-0 border-neutral-700 border-t border-b py-4">
            {memoizedTracks.map((track) => (
              <MemoizedDrumChannel
                key={track.id}
                id={track.id}
                name={track.name}
                params={track.params}
                onParamChange={trackParamChangeHandlers[track.id]}
                isActive={track.id === activeTrackId}
                onTrackSelect={trackSelectHandlers[track.id]}
                className="border-neutral-700 border-r px-1 last:border-r-0"
              />
            ))}
          </div>

          {/* Step Sequencer Section */}
          <div>
            <div className="mb-2 grid grid-cols-16 gap-1">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className="text-center text-neutral-400 text-xs">
                  {i + 1}
                </div>
              ))}
            </div>
            <MemoizedStepSequencer
              steps={activeTrackSteps}
              currentStep={currentStep}
              onStepToggle={handleActiveTrackStepToggle}
            />
          </div>
        </div>

        {/* Right Side Controls - Tempo */}
        <div className="flex w-[160px] flex-col items-center border-neutral-700 border-l">
          <div className="mb-2 rounded-sm bg-black px-4 py-2 font-mono text-2xl text-orange-500">{tempo.toFixed(1)}</div>
          <Knob value={tempo / 300} onChange={(value) => setTempo(Math.round(value * 300))} size="lg" label="TEMPO" />

          <div className="mt-6 flex flex-col gap-4">
            <button type="button" className="rounded-sm bg-neutral-800 px-4 py-2 text-white">
              TAP
            </button>

            <div className="flex flex-col items-center">
              <Knob value={0.5} onChange={() => {}} size="md" label="SHUFFLE" />
            </div>

            <div className="flex flex-col items-center">
              <Knob value={0.5} onChange={() => {}} size="md" label="FINE" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
