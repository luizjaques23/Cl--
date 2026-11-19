"use client";

/**
 * Motor de Áudio do Portal Oficial ALCATRAZZ
 * Reproduz a trilha sonora oficial (/assets/musicas.mp3) em loop contínuo
 * com controle de silenciar (mute/unmute) persistido no navegador.
 */

const MUTE_STORAGE_KEY = "alcatrazz_sound_muted";
const AUDIO_SRC = "/assets/musicas.mp3";

class MedievalAudioEngine {
  private audio: HTMLAudioElement | null = null;
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

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.audio) {
      const el = new Audio(AUDIO_SRC);
      el.loop = true;
      el.preload = "auto";
      el.volume = 0.55;
      el.muted = this.muted;

      el.addEventListener("play", () => {
        this.playing = true;
        this.emit();
      });

      el.addEventListener("pause", () => {
        this.playing = false;
        this.emit();
      });

      el.addEventListener("ended", () => {
        if (!this.muted) {
          el.currentTime = 0;
          el.play().catch(() => {});
        }
      });

      this.audio = el;
    }
    return this.audio;
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

  public startAmbient() {
    if (this.muted) {
      this.playing = false;
      this.emit();
      return;
    }

    const audio = this.ensureAudio();
    if (!audio) return;

    audio.muted = false;
    if (!audio.paused) {
      this.playing = true;
      this.emit();
      return;
    }

    audio
      .play()
      .then(() => {
        this.playing = true;
        this.emit();
      })
      .catch(() => {
        // Caso o navegador bloqueie autoplay antes do primeiro clique, aguardará o primeiro toque do usuário
        this.playing = false;
        this.emit();
      });
  }

  public stopAmbient() {
    if (this.audio) {
      this.audio.pause();
    }
    this.playing = false;
    this.emit();
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
    } catch {
      // ignore storage errors
    }

    const audio = this.ensureAudio();
    if (this.muted) {
      if (audio) {
        audio.muted = true;
        audio.pause();
      }
      this.playing = false;
    } else {
      if (audio) {
        audio.muted = false;
      }
      this.startAmbient();
    }
    this.emit();
    return this.muted;
  }

  public setMuted(mute: boolean) {
    if (this.muted === mute) return;
    this.toggleMute();
  }

  public playClickChime() {
    // Mantido por compatibilidade; se a música ainda não iniciou e não está silenciada, inicia
    if (!this.muted && !this.playing) {
      this.startAmbient();
    }
  }

  public playSuccessFanfare() {
    if (!this.muted && !this.playing) {
      this.startAmbient();
    }
  }
}

export const medievalAudio = new MedievalAudioEngine();
