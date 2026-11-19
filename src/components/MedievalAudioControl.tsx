"use client";

import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { medievalAudio } from "@/lib/medieval-audio";

export function MedievalAudioControl({
  variant = "floating",
}: {
  variant?: "floating" | "header";
}) {
  const [audioState, setAudioState] = useState({ playing: false, muted: false });

  useEffect(() => {
    const unsub = medievalAudio.subscribe(setAudioState);

      // Tenta iniciar imediatamente se não estiver silenciado
      if (!medievalAudio.getState().muted) {
        medievalAudio.startAmbient();
      }

      // Garante que em celulares (iOS/Android) e navegadores com bloqueio de autoplay, o primeiro toque libere a música
      const handleUnlock = () => {
        const current = medievalAudio.getState();
        if (!current.muted && !current.playing) {
          medievalAudio.startAmbient();
        }
        if (medievalAudio.getState().playing || medievalAudio.getState().muted) {
          window.removeEventListener("pointerdown", handleUnlock);
          window.removeEventListener("click", handleUnlock);
          window.removeEventListener("keydown", handleUnlock);
        }
      };

      window.addEventListener("pointerdown", handleUnlock, { passive: true });
      window.addEventListener("click", handleUnlock, { passive: true });
      window.addEventListener("keydown", handleUnlock, { passive: true });
      return () => {
        unsub();
        window.removeEventListener("pointerdown", handleUnlock);
        window.removeEventListener("click", handleUnlock);
        window.removeEventListener("keydown", handleUnlock);
      };
    }, []);

  const handleToggle = () => {
    medievalAudio.toggleMute();
  };

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={audioState.muted ? "Ativar Som Medieval" : "Silenciar Som Medieval"}
        aria-label={audioState.muted ? "Ativar Som Medieval" : "Silenciar Som Medieval"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medieval uppercase tracking-wider transition min-h-[40px] ${audioState.muted
            ? "bg-stone-900/90 border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-500"
            : "bg-[#790D16]/40 border-[#D6A33A]/60 text-[#D6A33A] hover:bg-[#790D16]/70 shadow-gold-glow"
          }`}
      >
        {audioState.muted ? (
          <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
        ) : (
          <Volume2 className="w-4 h-4 text-[#D6A33A] shrink-0" />
        )}
        <span className="hidden lg:inline">
          {audioState.muted ? "Silenciado" : "Som"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={audioState.muted ? "Ativar Som Medieval" : "Silenciar Som Medieval"}
      className={`fixed bottom-4 left-4 z-[90] flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl transition-all duration-300 min-h-[44px] ${audioState.muted
          ? "bg-[#0d0b0b]/90 border-stone-700/80 text-stone-400 hover:border-[#D6A33A]/50 hover:text-stone-200"
          : "bg-gradient-to-r from-[#21070a]/95 to-[#120e0c]/95 border-[#D6A33A]/70 text-[#D6A33A] shadow-gold-glow hover:scale-105"
        }`}
    >
      {audioState.muted ? (
        <>
          <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-[11px] font-medieval uppercase tracking-wider">
            Silenciado
          </span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-[#D6A33A] shrink-0" />
          <span className="text-[11px] font-medieval uppercase tracking-wider">
            Som Medieval
          </span>
          {/* Barrinhas animadas indicando áudio ativo */}
          <span className="flex items-end gap-0.5 h-3 ml-0.5">
            <span className="w-0.5 bg-[#D6A33A] rounded-full animate-pulse h-2" />
            <span
              className="w-0.5 bg-[#D66A19] rounded-full animate-pulse h-3"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="w-0.5 bg-[#D6A33A] rounded-full animate-pulse h-1.5"
              style={{ animationDelay: "0.4s" }}
            />
          </span>
        </>
      )}
    </button>
  );
}
