"use client";

/**
 * Motor de Áudio Medieval Procedural (Web Audio API)
 * Gera uma trilha sonora atmosférica de castelo medieval (drone harmônico + harpa/alaúde em Ré Dórico)
 * e efeitos sonoros sutis sem depender de arquivos externos.
 */

const MUTE_STORAGE_KEY = "alcatrazz_sound_muted";

class MedievalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneNodes: AudioNode[] = [];
  private harpTimer: ReturnType<typeof setTimeout> | null = null;
  private playing = false;
  private muted = false;
  private listeners: Set<(state: { playing: boolean; muted: boolean }) => void> =
    new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(MUTE_STORAGE_KEY);
        this.muted = saved === "true";
      } catch {
        this.muted = false;
      }
    }
  }

  public subscribe(
    cb: (state: { playing: boolean; muted: boolean }) => void
  ): () => void {
    this.listeners.add(cb);
    cb({ playing: this.playing, muted: this.muted });
    return () => {
      this.listeners.delete(cb);
    };
  }

  private emit() {
    const state = { playing: this.playing, muted: this.muted };
    this.listeners.forEach((cb) => cb(state));
  }

  public getState() {
    return { playing: this.playing, muted: this.muted };
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : 0.28,
        this.ctx.currentTime
      );
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startAmbient() {
    if (this.muted) {
      this.playing = false;
      this.emit();
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (this.playing) return;
    this.playing = true;
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(0.28, ctx.currentTime, 0.8);

    this.startDrone(ctx);
    this.scheduleHarpNote(ctx);
    this.emit();
  }

  private startDrone(ctx: AudioContext) {
    this.stopDrone();
    if (!this.masterGain) return;

    // Filtro passa-baixa para som quente e distante de salão medieval
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(340, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
    droneGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 2.5);

    filter.connect(droneGain);
    droneGain.connect(this.masterGain);

    // Acorde medieval aberto (Ré2 + Lá2 + Ré3) sem terça para sonoridade épica antiga
    const freqs = [73.42, 110.0, 146.83];
    const oscs: OscillatorNode[] = [];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(idx === 0 ? 0.55 : 0.25, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      oscs.push(osc);
    });

    // LFO sutil simulando respiração de tochas / vento no castelo
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(90, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.droneNodes = [...oscs, lfo, filter, droneGain, lfoGain];
  }

  private stopDrone() {
    this.droneNodes.forEach((node) => {
      try {
        if ("stop" in node && typeof (node as OscillatorNode).stop === "function") {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore cleanup errors
      }
    });
    this.droneNodes = [];
  }

  private scheduleHarpNote(ctx: AudioContext) {
    if (!this.playing || this.muted) return;

    // Escala Dórica Medieval em Ré (D4, E4, F4, G4, A4, B4, C5, D5)
    const dorianScale = [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];
    const note = dorianScale[Math.floor(Math.random() * dorianScale.length)];

    this.pluckHarp(ctx, note, 0.14);

    // Ocasionalmente toca uma quinta justa harmônica suave
    if (Math.random() > 0.55) {
      setTimeout(() => {
        if (this.playing && !this.muted && this.ctx) {
          this.pluckHarp(this.ctx, note * 1.5, 0.08);
        }
      }, 260);
    }

    const nextDelay = 1500 + Math.random() * 2400;
    this.harpTimer = setTimeout(() => {
      if (this.ctx && this.playing && !this.muted) {
        this.scheduleHarpNote(this.ctx);
      }
    }, nextDelay);
  }

  private pluckHarp(ctx: AudioContext, freq: number, volume: number) {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 2.2);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(volume, now + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 2.6);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.7);
  }

  public stopAmbient() {
    this.playing = false;
    if (this.harpTimer) {
      clearTimeout(this.harpTimer);
      this.harpTimer = null;
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
    setTimeout(() => {
      if (!this.playing) {
        this.stopDrone();
      }
    }, 350);
    this.emit();
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    } catch {
      // ignore storage errors
    }

    if (this.muted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
      this.playClickChime();
    }
    this.emit();
    return this.muted;
  }

  public setMuted(mute: boolean) {
    if (this.muted === mute) return;
    this.toggleMute();
  }

  public playClickChime() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.pluckHarp(ctx, 587.33, 0.12);
  }

  public playSuccessFanfare() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    // Tríade épica em Ré (D4 -> A4 -> D5)
    [293.66, 440.0, 587.33].forEach((freq, i) => {
      setTimeout(() => {
        if (this.ctx && !this.muted) {
          this.pluckHarp(this.ctx, freq, 0.14);
        }
      }, i * 110);
    });
  }
}

export const medievalAudio = new MedievalAudioEngine();
