import type { Config } from "tailwindcss";

const config: Config = {
  content: [],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: { bg: "#0a0a0f", card: "rgba(255,255,255,0.03)", hover: "rgba(255,255,255,0.06)" },
        border: { glass: "rgba(255,255,255,0.08)", active: "rgba(255,255,255,0.15)" },
        accent: { green: "#00ff88", blue: "#3b82f6", amber: "#f59e0b", red: "#ef4444" },
        text: { primary: "#e5e5e5", muted: "#666666", dim: "#444444" },
        terminal: { bg: "rgba(0,0,0,0.4)" },
      },
      fontFamily: { mono: ["JetBrains Mono", "Fira Code", "monospace"] },
    },
  },
  plugins: [],
};
export default config;
