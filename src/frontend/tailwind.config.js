import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        /* Semantic tokens mapped to CSS var RGB triples */
        background:  "rgb(var(--background) / <alpha-value>)",
        foreground:  "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT:    "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT:    "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT:    "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:    "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT:    "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT:    "#22C55E",
          deep:       "#16A34A",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT:    "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border:  "rgb(var(--border) / <alpha-value>)",
        input:   "rgb(var(--input) / <alpha-value>)",
        ring:    "rgb(var(--ring) / <alpha-value>)",
        surface: "#F8F9FA",
        "border-light": "#DCFCE7",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["ui-monospace", "SF Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs:       "0 1px 2px 0 rgba(0,0,0,0.05)",
        elevated: "0 8px 24px -4px rgba(0,0,0,0.08), 0 4px 8px -2px rgba(0,0,0,0.04)",
        subtle:   "0 2px 6px -2px rgba(0,0,0,0.06)",
        card:     "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "sos-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.7)" },
          "50%":      { boxShadow: "0 0 0 10px rgba(239,68,68,0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%":   { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)",   opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "sos-pulse":      "sos-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in":        "fade-in 0.3s ease-out",
        "slide-up":       "slide-up 0.3s cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
