import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "24px",
      screens: { "2xl": "1120px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      maxWidth: {
        page: "1120px",
      },
      letterSpacing: {
        display: "-0.02em",
      },
      colors: {
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--accent)",
        background: "var(--bg)",
        foreground: "var(--text)",
        primary: {
          DEFAULT: "var(--accent-fill)",
          foreground: "var(--on-accent)",
        },
        secondary: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "var(--on-accent)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--on-accent)",
        },
        muted: {
          DEFAULT: "var(--bg)",
          foreground: "var(--muted)",
        },
        accent: {
          DEFAULT: "var(--bg)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
        "fade-in": "fade-in 300ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
