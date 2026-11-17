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
          black: "#090909",
          red: "#790D16",
          crimson: "#a3121e",
          gold: "#D6A33A",
          goldLight: "#f3c969",
          orange: "#D66A19",
          gray: "#292929",
          darkCard: "#111010",
        },
      },
      fontFamily: {
        medieval: ["var(--font-cinzel)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D6A33A 0%, #f5d77f 50%, #9e7019 100%)",
        "blood-gradient": "linear-gradient(135deg, #790D16 0%, #42050a 100%)",
        "fire-gradient": "linear-gradient(135deg, #790D16 0%, #D66A19 50%, #D6A33A 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(214, 163, 58, 0.25), inset 0 0 12px rgba(214, 163, 58, 0.1)",
        "gold-glow-strong": "0 0 30px rgba(214, 163, 58, 0.5), 0 0 60px rgba(214, 106, 25, 0.25)",
        "red-glow": "0 0 25px rgba(121, 13, 22, 0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
