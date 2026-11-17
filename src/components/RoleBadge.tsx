"use client";

import React from "react";
import {
  Crown,
  Flame,
  Swords,
  ShieldAlert,
  Award,
  ShieldCheck,
  Shield,
  Star,
  Sparkles,
  Crosshair,
  Hammer,
  Wand2,
  HeartPulse,
  Skull,
  Zap,
} from "lucide-react";
import { Cargo, PlayerClass } from "@/types/portal";

export function renderRankIcon(simbolo: string, className = "w-4 h-4") {
  switch (simbolo) {
    case "Crown":
      return <Crown className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "Swords":
      return <Swords className={className} />;
    case "ShieldAlert":
      return <ShieldAlert className={className} />;
    case "Award":
      return <Award className={className} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} />;
    case "Star":
      return <Star className={className} />;
    default:
      return <Shield className={className} />;
  }
}

export function renderClassIcon(classe: PlayerClass, className = "w-4 h-4") {
  switch (classe) {
    case "Cavaleiro":
    case "Guerreira":
      return <Swords className={className} />;
    case "Pike":
    case "Lutador":
      return <Zap className={className} />;
    case "Atalanta":
    case "Arqueira":
      return <Crosshair className={className} />;
    case "Mecânico":
      return <Hammer className={className} />;
    case "Mago":
    case "Xamã":
      return <Wand2 className={className} />;
    case "Sacerdotisa":
      return <HeartPulse className={className} />;
    case "Assassina":
      return <Skull className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export function RoleBadge({
  cargo,
  size = "md",
}: {
  cargo?: Cargo;
  size?: "sm" | "md" | "lg";
}) {
  if (!cargo) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700">
        <Shield className="w-3.5 h-3.5" /> Membro
      </span>
    );
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1"
      : size === "lg"
      ? "px-3.5 py-1.5 text-sm gap-2"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medieval font-bold tracking-wider uppercase rounded-md border shadow-sm ${sizeClasses}`}
      style={{
        backgroundColor: `${cargo.cor_hex}18`,
        borderColor: `${cargo.cor_hex}80`,
        color: cargo.cor_hex,
        boxShadow: `0 0 12px ${cargo.cor_hex}22`,
      }}
    >
      {renderRankIcon(
        cargo.simbolo,
        size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"
      )}
      {cargo.nome}
    </span>
  );
}
