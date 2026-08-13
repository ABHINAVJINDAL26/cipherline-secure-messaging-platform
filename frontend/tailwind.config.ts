import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        signal: {
          blue: "#2C6BED",
          "blue-dark": "#1B4DBB",
          "blue-light": "#3A76F0",
          green: "#2ECC71",
          red: "#EF4444",
        },
      },
      borderRadius: {
        bubble: "18px",
      },
      animation: {
        "typing-bounce": "typingBounce 1.2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        "message-appear": "messageAppear 0.15s ease-out",
        "toast-in": "toastSlideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.15s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
      },
      keyframes: {
        typingBounce: {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-5px)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        messageAppear: {
          from: { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        toastSlideIn: {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      boxShadow: {
        signal: "0 4px 12px rgba(44, 107, 237, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
