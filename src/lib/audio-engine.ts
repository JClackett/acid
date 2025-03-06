export class AudioEngine {
  private context: AudioContext
  private masterGain: GainNode
  private unlocked = false

  constructor() {
    this.context = new AudioContext()
    this.masterGain = this.context.createGain()
    this.masterGain.connect(this.context.destination)
    this.masterGain.gain.value = 0.7
  }

  // Create a white noise source
  createNoiseSource(): AudioBufferSourceNode {
    const bufferSize = this.context.sampleRate * 2
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.context.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    return noise
  }

  // Create an oscillator
  createOscillator(type: OscillatorType, frequency: number): OscillatorNode {
    const osc = this.context.createOscillator()
    osc.type = type
    osc.frequency.value = frequency
    return osc
  }

  // Create a filter
  createFilter(type: BiquadFilterType, frequency: number, Q: number): BiquadFilterNode {
    const filter = this.context.createBiquadFilter()
    filter.type = type
    filter.frequency.value = frequency
    filter.Q.value = Q
    return filter
  }

  // Create an envelope
  applyEnvelope(param: AudioParam, attackTime: number, decayTime: number, sustainLevel: number, releaseTime: number): void {
    const now = this.context.currentTime
    param.cancelScheduledValues(now)
    param.setValueAtTime(0, now)
    param.linearRampToValueAtTime(1, now + attackTime)
    param.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime)
    param.linearRampToValueAtTime(0, now + attackTime + decayTime + releaseTime)
  }

  // Get current audio context
  getContext(): AudioContext {
    return this.context
  }

  // Get master gain node
  getMasterGain(): GainNode {
    return this.masterGain
  }

  // Resume audio context (needed for browsers that suspend it)
  resume(): Promise<void> {
    if (this.unlocked) {
      return this.context.resume()
    }

    // Create and play a silent buffer to unlock audio on iOS/Safari
    return new Promise((resolve, reject) => {
      // Try to resume the context
      this.context
        .resume()
        .then(() => {
          // Create a silent buffer
          const buffer = this.context.createBuffer(1, 1, 22050)
          const source = this.context.createBufferSource()
          source.buffer = buffer
          source.connect(this.context.destination)

          // Play the silent buffer
          const startTime = this.context.currentTime
          source.start(startTime)
          source.stop(startTime + 0.001)

          // Mark as unlocked and resolve
          this.unlocked = true
          console.log("AudioEngine unlocked")
          resolve()
        })
        .catch((err) => {
          console.error("Failed to resume audio context:", err)
          reject(err)
        })
    })
  }

  // Check if audio is unlocked
  isUnlocked(): boolean {
    return this.unlocked
  }
}

// Drum sound generators
export class DrumSounds {
  private engine: AudioEngine

  constructor(engine: AudioEngine) {
    this.engine = engine
  }

  // Bass Drum (BD)
  triggerBassDrum(params: { tune: number; attack: number; decay: number; comp: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    // Oscillator for the main tone
    const osc = this.engine.createOscillator("sine", 55 + params.tune * 20)

    // Gain node for the envelope
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    // Compressor for punch
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -24 + params.comp * 12
    compressor.ratio.value = 12
    compressor.attack.value = 0.003

    // Connect the nodes
    osc.connect(gainNode)
    gainNode.connect(compressor)
    compressor.connect(this.engine.getMasterGain())

    // Apply pitch envelope
    osc.frequency.setValueAtTime(120 + params.tune * 40, now)
    osc.frequency.exponentialRampToValueAtTime(55 + params.tune * 20, now + 0.15)

    // Apply amplitude envelope with level
    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(level, now + 0.005 + params.attack * 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.5)

    // Start and stop
    osc.start(now)
    osc.stop(now + 0.1 + params.decay * 0.5)
  }

  // Snare Drum (SD)
  triggerSnareDrum(params: { tune: number; snappy: number; decay: number; comp: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    // Noise component
    const noise = this.engine.createNoiseSource()
    const noiseFilter = this.engine.createFilter("highpass", 1000 + params.tune * 500, 1)
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0

    // Tone component
    const osc = this.engine.createOscillator("triangle", 180 + params.tune * 40)
    const oscGain = ctx.createGain()
    oscGain.gain.value = 0

    // Compressor
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -24 + params.comp * 12
    compressor.ratio.value = 12

    // Connect noise chain
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(compressor)

    // Connect oscillator chain
    osc.connect(oscGain)
    oscGain.connect(compressor)

    // Connect to master
    compressor.connect(this.engine.getMasterGain())

    // Apply level
    const level = params.level !== undefined ? params.level : 1.0

    // Apply envelopes
    noiseGain.gain.setValueAtTime(0, now)
    noiseGain.gain.linearRampToValueAtTime(params.snappy * 0.7 * level, now + 0.005)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.3)

    oscGain.gain.setValueAtTime(0, now)
    oscGain.gain.linearRampToValueAtTime(0.5 * level, now + 0.005)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.2)

    // Start and stop
    noise.start(now)
    osc.start(now)
    noise.stop(now + 0.1 + params.decay * 0.3)
    osc.stop(now + 0.1 + params.decay * 0.2)
  }

  // Low Tom (LT)
  triggerLowTom(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const osc = this.engine.createOscillator("sine", 80 + params.tune * 30)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    osc.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.3)

    osc.frequency.setValueAtTime(120 + params.tune * 40, now)
    osc.frequency.exponentialRampToValueAtTime(80 + params.tune * 30, now + 0.1)

    osc.start(now)
    osc.stop(now + 0.1 + params.decay * 0.3)
  }

  // Mid Tom (MT)
  triggerMidTom(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const osc = this.engine.createOscillator("sine", 120 + params.tune * 40)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    osc.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.3)

    osc.frequency.setValueAtTime(160 + params.tune * 50, now)
    osc.frequency.exponentialRampToValueAtTime(120 + params.tune * 40, now + 0.1)

    osc.start(now)
    osc.stop(now + 0.1 + params.decay * 0.3)
  }

  // High Tom (HT)
  triggerHighTom(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const osc = this.engine.createOscillator("sine", 180 + params.tune * 60)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    osc.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.3)

    osc.frequency.setValueAtTime(220 + params.tune * 70, now)
    osc.frequency.exponentialRampToValueAtTime(180 + params.tune * 60, now + 0.1)

    osc.start(now)
    osc.stop(now + 0.1 + params.decay * 0.3)
  }

  // Rim Shot (RS)
  triggerRimShot(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const osc1 = this.engine.createOscillator("square", 330 + params.tune * 100)
    const osc2 = this.engine.createOscillator("sine", 600 + params.tune * 150)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.6 * level, now + 0.001)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.02 + params.decay * 0.1)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.02 + params.decay * 0.1)
    osc2.stop(now + 0.02 + params.decay * 0.1)
  }

  // Hand Clap (HC)
  triggerHandClap(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const noise = this.engine.createNoiseSource()
    const filter = this.engine.createFilter("bandpass", 1200 + params.tune * 400, 2)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    // Multi-trigger envelope for clap effect
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.001)
    gainNode.gain.linearRampToValueAtTime(0.3 * level, now + 0.01)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.02)
    gainNode.gain.linearRampToValueAtTime(0.3 * level, now + 0.03)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.04)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.2)

    noise.start(now)
    noise.stop(now + 0.1 + params.decay * 0.2)
  }

  // Closed Hi-hat (CH)
  triggerClosedHihat(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const noise = this.engine.createNoiseSource()
    const filter = this.engine.createFilter("highpass", 8000 + params.tune * 2000, 3)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.001)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + params.decay * 0.1)

    noise.start(now)
    noise.stop(now + 0.05 + params.decay * 0.1)
  }

  // Open Hi-hat (OH)
  triggerOpenHihat(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const noise = this.engine.createNoiseSource()
    const filter = this.engine.createFilter("highpass", 8000 + params.tune * 2000, 3)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.7 * level, now + 0.001)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + params.decay * 0.5)

    noise.start(now)
    noise.stop(now + 0.3 + params.decay * 0.5)
  }

  // Crash Cymbal (CC)
  triggerCrashCymbal(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    const noise = this.engine.createNoiseSource()
    const filter = this.engine.createFilter("highpass", 5000 + params.tune * 1000, 2)
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.8 * level, now + 0.001)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1 + params.decay * 1)

    noise.start(now)
    noise.stop(now + 1 + params.decay * 1)
  }

  // Ride Cymbal (RC)
  triggerRideCymbal(params: { tune: number; decay: number; level?: number }): void {
    const ctx = this.engine.getContext()
    const now = ctx.currentTime

    // Combine noise and oscillators for complex ride sound
    const noise = this.engine.createNoiseSource()
    const noiseFilter = this.engine.createFilter("highpass", 7000 + params.tune * 1000, 2)
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.3

    const osc1 = this.engine.createOscillator("square", 3000 + params.tune * 500)
    const osc2 = this.engine.createOscillator("square", 4500 + params.tune * 500)
    const oscGain = ctx.createGain()
    oscGain.gain.value = 0

    const mainGain = ctx.createGain()
    mainGain.gain.value = 0

    // Connect noise chain
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(mainGain)

    // Connect oscillator chain
    osc1.connect(oscGain)
    osc2.connect(oscGain)
    oscGain.connect(mainGain)

    // Connect to master
    mainGain.connect(this.engine.getMasterGain())

    const level = params.level !== undefined ? params.level : 1.0
    // Apply envelopes
    mainGain.gain.setValueAtTime(0, now)
    mainGain.gain.linearRampToValueAtTime(0.7 * level, now + 0.001)
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + params.decay * 0.8)

    oscGain.gain.setValueAtTime(0, now)
    oscGain.gain.linearRampToValueAtTime(0.3 * level, now + 0.001)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + params.decay * 0.2)

    // Start and stop
    noise.start(now)
    osc1.start(now)
    osc2.start(now)
    noise.stop(now + 0.5 + params.decay * 0.8)
    osc1.stop(now + 0.1 + params.decay * 0.2)
    osc2.stop(now + 0.1 + params.decay * 0.2)
  }
}
