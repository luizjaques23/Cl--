import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        alcatrazz: {
          black: "#07050b",
          red: "#790D16",
          crimson: "#b91c1c",
          purple: "#9333ea",
          magenta: "#d946ef",
          gold: "#D6A33A",
          goldLight: "#f3c969",
          orange: "#D66A19",
          gray: "#292929",
          darkCard: "#110c18",
        },
      },
      fontFamily: {
        medieval: ["var(--font-cinzel)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D6A33A 0%, #f5d77f 50%, #9e7019 100%)",
        "blood-gradient": "linear-gradient(135deg, #790D16 0%, #4c0519 50%, #3b0764 100%)",
        "fire-gradient": "linear-gradient(135deg, #790D16 0%, #a855f7 50%, #D6A33A 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 22px rgba(168, 85, 247, 0.28), 0 0 15px rgba(214, 163, 58, 0.25), inset 0 0 12px rgba(168, 85, 247, 0.12)",
        "gold-glow-strong": "0 0 35px rgba(168, 85, 247, 0.55), 0 0 60px rgba(214, 163, 58, 0.35), 0 0 25px rgba(185, 28, 28, 0.4)",
        "red-glow": "0 0 25px rgba(185, 28, 28, 0.6), 0 0 20px rgba(147, 51, 234, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
