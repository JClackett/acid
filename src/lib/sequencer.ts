export interface Step {
  active: boolean
  accent: boolean
}

export type TrackId = "bd" | "sd" | "lt" | "mt" | "ht" | "rs" | "hc" | "ch" | "oh" | "cc" | "rc"

export interface Track {
  id: TrackId
  name: string
  steps: Step[]
  params: Record<string, number>
}

export interface Pattern {
  id: string
  tracks: Track[]
  tempo: number
}

export class Sequencer {
  private pattern: Pattern
  private currentStep = 0
  private isPlaying = false
  private intervalId: number | null = null
  private onStepCallback: ((step: number, tracks: Track[]) => void) | null = null
  private lastStepTime = 0

  constructor(pattern: Pattern) {
    this.pattern = pattern
  }

  start(): void {
    if (this.isPlaying) return

    this.isPlaying = true
    this.lastStepTime = performance.now()

    // Use requestAnimationFrame for more accurate timing, especially in Safari
    const scheduleStep = () => {
      if (!this.isPlaying) return

      // Calculate step time based on current tempo - allows for dynamic tempo changes
      const stepTime = 60000 / this.pattern.tempo / 4 // 16th notes

      const currentTime = performance.now()
      if (currentTime - this.lastStepTime >= stepTime) {
        if (this.onStepCallback) {
          this.onStepCallback(this.currentStep, this.getActiveTracksForStep(this.currentStep))
        }

        this.currentStep = (this.currentStep + 1) % 16
        this.lastStepTime = currentTime
      }

      requestAnimationFrame(scheduleStep)
    }

    // Start the scheduler
    requestAnimationFrame(scheduleStep)
  }

  stop(): void {
    if (!this.isPlaying) return

    this.isPlaying = false
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Don't reset the current step when stopping
    // this.currentStep = 0
  }

  setTempo(tempo: number): void {
    // Simply update the tempo without stopping and restarting
    // This will take effect on the next step calculation
    this.pattern.tempo = tempo

    // No need to stop and restart - the scheduler will use the new tempo value
    // on its next iteration when calculating the step time
  }

  getPattern(): Pattern {
    return this.pattern
  }

  setPattern(pattern: Pattern): void {
    const wasRunning = this.isPlaying
    const currentStep = this.currentStep

    if (wasRunning) {
      this.stop()
    }

    this.pattern = pattern
    this.currentStep = currentStep

    if (wasRunning) {
      this.start()
    }
  }

  toggleStep(trackId: string, step: number): void {
    const track = this.pattern.tracks.find((t) => t.id === trackId)
    if (track) {
      track.steps[step].active = !track.steps[step].active
    }
  }

  toggleAccent(trackId: string, step: number): void {
    const track = this.pattern.tracks.find((t) => t.id === trackId)
    if (track?.steps[step].active) {
      track.steps[step].accent = !track.steps[step].accent
    }
  }

  setTrackParam(trackId: string, param: string, value: number): void {
    const track = this.pattern.tracks.find((t) => t.id === trackId)
    if (track) {
      track.params[param] = value
    }
  }

  onStep(callback: (step: number, tracks: Track[]) => void): void {
    this.onStepCallback = callback
  }

  private getActiveTracksForStep(step: number): Track[] {
    return this.pattern.tracks.filter((track) => track.steps[step].active)
  }

  isRunning(): boolean {
    return this.isPlaying
  }

  getCurrentStep(): number {
    return this.currentStep
  }
}

// Create a default pattern
export function createDefaultPattern(): Pattern {
  const createTrack = (id: TrackId, name: string): Track => ({
    id,
    name,
    steps: Array(16)
      .fill(null)
      .map(() => ({ active: false, accent: false })),
    params: {
      tune: 0.5,
      decay: 0.5,
      attack: 0.5,
      comp: 0.5,
      snappy: 0.5,
    },
  })

  return {
    id: "default",
    tempo: 128,
    tracks: [
      createTrack("bd", "Bass Drum"),
      createTrack("sd", "Snare Drum"),
      createTrack("lt", "Low Tom"),
      createTrack("mt", "Mid Tom"),
      createTrack("ht", "High Tom"),
      createTrack("rs", "Rim Shot"),
      createTrack("hc", "Hand Clap"),
      createTrack("ch", "Closed Hi-hat"),
      createTrack("oh", "Open Hi-hat"),
      createTrack("cc", "Crash Cymbal"),
      createTrack("rc", "Ride Cymbal"),
    ],
  }
}
