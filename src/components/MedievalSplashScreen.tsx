"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Volume2, VolumeX, Sparkles } from "lucide-react";
import { medievalAudio } from "@/lib/medieval-audio";

interface MedievalSplashScreenProps {
  onFinish: () => void;
}

const LOADING_MESSAGES = [
  "Forjando Brasão Real...",
  "Despertando Guardiões...",
  "Alinhando Runas de Bellatra...",
  "Abrindo Portões de ALCATRAZZ...",
];

export function MedievalSplashScreen({ onFinish }: MedievalSplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(medievalAudio.getState().muted);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(100, prev + 3);
      });
    }, 55);

    const msgTimer = setInterval(() => {
      setMsgIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 550);

    return () => {
      clearInterval(progressTimer);
      clearInterval(msgTimer);
    };
  }, []);

  // Entrada automática suave após carregar 100%
  useEffect(() => {
    if (progress >= 100) {
      const autoTimer = setTimeout(() => {
        handleEnter(false);
      }, 650);
      return () => clearTimeout(autoTimer);
    }
  }, [progress]);

  const handleEnter = (userTriggered: boolean) => {
    if (!visible) return;
    if (userTriggered && !medievalAudio.getState().muted) {
      medievalAudio.startAmbient();
      medievalAudio.playSuccessFanfare();
    }
    setVisible(false);
    setTimeout(() => {
      onFinish();
    }, 550);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const mutedNow = medievalAudio.toggleMute();
    setIsMuted(mutedNow);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          onClick={() => handleEnter(true)}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#060505] text-stone-100 px-6 py-8 overflow-hidden select-none cursor-pointer"
        >
          {/* Fundo Medieval Radiante */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(121,13,22,0.32)_0%,rgba(9,9,9,0.96)_65%,#050404_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(214,163,58,0.14)_0%,transparent_55%)] pointer-events-none" />

          {/* Brasas Flutuantes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="ember-particle absolute bottom-12 left-[20%] w-2 h-2 rounded-full bg-[#D66A19] blur-[1px]" />
            <span
              className="ember-particle absolute bottom-20 left-[75%] w-2 h-2 rounded-full bg-[#D6A33A]"
              style={{ animationDelay: "1.1s" }}
            />
            <span
              className="ember-particle absolute bottom-10 left-[48%] w-1.5 h-1.5 rounded-full bg-[#790D16]"
              style={{ animationDelay: "2.1s" }}
            />
          </div>

          {/* Botão de Som no Canto Superior Direito */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Ativar som medieval" : "Silenciar som medieval"}
            className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/70 border border-[#D6A33A]/50 text-xs font-medieval text-[#D6A33A] hover:border-[#D6A33A] hover:bg-[#790D16]/40 transition min-h-[40px]"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Silenciado</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#D6A33A]" />
                <span className="hidden sm:inline">Som Ativo</span>
              </>
            )}
          </button>

          {/* Núcleo Animado da Splash Screen */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
            {/* Logotipo / Brasão em Movimento com Anéis Rúnicos */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-7">
              {/* Anel Externo Giratório Dourado */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#D6A33A]/55 shadow-[0_0_25px_rgba(214,163,58,0.25)]"
              />

              {/* Anel Interno Giratório Contrário Carmesim */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2.5 rounded-full border border-[#D66A19]/60"
              />

              {/* Aura Pulsante */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.85, 0.45] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-4 rounded-full bg-[#790D16]/40 blur-xl"
              />

              {/* Brasão Oficial Flutuante */}
              <motion.div
                initial={{ scale: 0.72, opacity: 0 }}
                animate={{
                  scale: [0.96, 1.03, 0.96],
                  y: [0, -6, 0],
                  opacity: 1,
                }}
                transition={{
                  scale: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 0.6 },
                }}
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#D6A33A] shadow-[0_0_35px_rgba(214,163,58,0.5)]"
              >
                <img
                  src="/assets/alcatrazz-crest.jpg"
                  alt="Brasão Oficial ALCATRAZZ"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            {/* Nome do Clã */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-medieval text-3xl sm:text-5xl font-black tracking-[0.18em] gold-text-gradient drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
            >
              ALCATRAZZ
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-2 font-medieval text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#D6A33A]"
            >
              Honra • Lealdade • Poder
            </motion.p>

            {/* Barra de Carregamento Medieval */}
            <div className="w-full mt-8 space-y-2.5">
              <div className="h-2.5 w-full rounded-full bg-stone-900/90 border border-[#D6A33A]/40 overflow-hidden p-0.5 shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#790D16] via-[#D66A19] to-[#D6A33A] shadow-[0_0_12px_rgba(214,163,58,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium px-1">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <Sparkles className="w-3.5 h-3.5 text-[#D6A33A]" />
                  {LOADING_MESSAGES[msgIndex]}
                </span>
                <span className="font-medieval text-[#D6A33A] font-bold">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Botão Interativo para Entrar & Liberar Áudio no Mobile */}
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              onClick={(e) => {
                e.stopPropagation();
                handleEnter(true);
              }}
              className="mt-7 btn-royal-gold px-7 py-3 rounded-xl text-xs sm:text-sm font-medieval uppercase tracking-widest flex items-center gap-2 min-h-[44px]"
            >
              <Shield className="w-4 h-4" />
              Entrar no Portal
            </motion.button>

            <span className="mt-3 text-[10px] text-stone-500 uppercase tracking-widest">
              Toque em qualquer lugar para entrar
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
