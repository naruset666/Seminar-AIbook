// Web Audio soundscape player (CLAUDE.md section 8).
//
//   AudioBufferSourceNode(loop) → GainNode(volume) → StereoPannerNode(pan) ─┐
//   AudioBufferSourceNode(loop) → GainNode(volume) → StereoPannerNode(pan) ─┼→ master GainNode → speakers
//
// One AudioContext for the whole page, created on the first user gesture (browsers
// block autoplay). Looping AudioBuffers instead of <audio loop> gives gapless loops.

export interface LayerParams {
  volume: number; // 0..1
  pan: number; // -1 (left) .. 1 (right)
  muted: boolean;
}

export interface LayerSpec {
  id: string;
  src: string;
  params: LayerParams;
}

interface DecodedLoop {
  buffer: AudioBuffer;
  loopStart: number; // seconds; skips encoder padding so the loop has no silent gap
  loopEnd: number;
}

interface LiveLayer {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: StereoPannerNode;
}

const FADE_SECONDS = 1; // preset changes fade out/in over about a second
const SMOOTHING = 0.05; // time constant for slider changes (avoids clicks)
const SILENCE = 1e-4;

// First/last non-silent sample, so MP3 encoder padding is not part of the loop.
function findLoopBounds(buffer: AudioBuffer): [number, number] {
  let first = buffer.length;
  let last = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    let i = 0;
    while (i < data.length && Math.abs(data[i]) < SILENCE) i++;
    let j = data.length - 1;
    while (j > i && Math.abs(data[j]) < SILENCE) j--;
    first = Math.min(first, i);
    last = Math.max(last, j);
  }
  if (first >= last) return [0, buffer.duration];
  return [first / buffer.sampleRate, (last + 1) / buffer.sampleRate];
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterVolume = 1;
  private decoded = new Map<string, Promise<DecodedLoop>>();
  private live = new Map<string, LiveLayer>();
  private wanted: LayerSpec[] = [];
  private generation = 0;

  get started(): boolean {
    return this.ctx !== null;
  }

  get playing(): boolean {
    return this.ctx?.state === 'running';
  }

  /** Starts (or resumes) playback. Must be called from a user gesture the first time. */
  async play(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterVolume;
      this.master.connect(this.ctx.destination);
      await this.applyLayers(this.wanted, false);
    }
    await this.ctx.resume();
  }

  async pause(): Promise<void> {
    await this.ctx?.suspend();
  }

  /** Switches to a new set of layers, fading the old ones out and the new ones in. */
  async setLayers(layers: LayerSpec[]): Promise<void> {
    this.wanted = layers;
    if (this.ctx) await this.applyLayers(layers, true);
  }

  setLayerParams(id: string, params: LayerParams): void {
    const spec = this.wanted.find((layer) => layer.id === id);
    if (spec) spec.params = params;
    const layer = this.live.get(id);
    if (!layer || !this.ctx) return;
    const now = this.ctx.currentTime;
    layer.gain.gain.setTargetAtTime(params.muted ? 0 : params.volume, now, SMOOTHING);
    layer.panner.pan.setTargetAtTime(params.pan, now, SMOOTHING);
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = volume;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, SMOOTHING);
  }

  dispose(): void {
    this.generation++;
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.master = null;
    this.live.clear();
  }

  private decode(src: string): Promise<DecodedLoop> {
    let entry = this.decoded.get(src);
    if (!entry) {
      const ctx = this.ctx!;
      entry = fetch(src)
        .then((response) => {
          if (!response.ok) throw new Error(`Cannot load ${src}`);
          return response.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          const [loopStart, loopEnd] = findLoopBounds(buffer);
          return { buffer, loopStart, loopEnd };
        });
      entry.catch(() => this.decoded.delete(src));
      this.decoded.set(src, entry);
    }
    return entry;
  }

  private async applyLayers(layers: LayerSpec[], fade: boolean): Promise<void> {
    const ctx = this.ctx!;
    const generation = ++this.generation;

    // Fade out and stop whatever is playing now.
    const now = ctx.currentTime;
    for (const layer of this.live.values()) {
      layer.gain.gain.cancelScheduledValues(now);
      layer.gain.gain.setTargetAtTime(0, now, FADE_SECONDS / 4);
      layer.source.stop(now + FADE_SECONDS * 1.5);
    }
    this.live.clear();

    const results = await Promise.allSettled(layers.map((layer) => this.decode(layer.src)));
    if (generation !== this.generation || !this.master) return; // a newer preset took over

    const start = ctx.currentTime;
    results.forEach((result, i) => {
      if (result.status !== 'fulfilled') {
        console.error(result.reason);
        return;
      }
      const { id, params } = layers[i];
      const { buffer, loopStart, loopEnd } = result.value;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = loopStart;
      source.loopEnd = loopEnd;

      const gain = ctx.createGain();
      const target = params.muted ? 0 : params.volume;
      if (fade) {
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(target, start, FADE_SECONDS / 4);
      } else {
        gain.gain.value = target;
      }

      const panner = ctx.createStereoPanner();
      panner.pan.value = params.pan;

      source.connect(gain).connect(panner).connect(this.master!);
      source.start(start, loopStart);
      this.live.set(id, { source, gain, panner });
    });
  }
}
