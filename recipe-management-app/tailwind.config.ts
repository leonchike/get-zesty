import type { Config } from "tailwindcss";

const config = {
  darkMode: "media",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        logo: ["var(--font-logo)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        // Legacy aliases (migration)
        pageBg: {
          DEFAULT: "hsl(var(--background))",
          light: "hsl(var(--background))",
          dark: "hsl(var(--background))",
        },
        textColor: {
          DEFAULT: "hsl(var(--foreground))",
          light: "hsl(var(--foreground))",
          dark: "hsl(var(--foreground))",
        },
        primaryHover: {
          DEFAULT: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-hover))",
          dark: "hsl(var(--primary-hover))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary))",
          dark: "hsl(var(--primary))",
        },
        brand: {
          DEFAULT: "hsl(var(--primary))",
          light: "hsl(var(--primary))",
          dark: "hsl(var(--primary))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
        },
        brandBlue: {
          DEFAULT: "rgba(83, 58, 253, 1)",
          light: "rgba(83, 58, 253, 1)",
          dark: "rgba(10, 132, 255, 1)",
        },
        brandGreen: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success))",
          dark: "hsl(var(--success))",
        },
        textGray: {
          DEFAULT: "hsl(var(--muted-foreground))",
          light: "hsl(var(--muted-foreground))",
          dark: "hsl(var(--muted-foreground))",
        },
        inputGray: {
          DEFAULT: "hsl(var(--input))",
          light: "hsl(var(--input))",
          dark: "hsl(var(--input))",
        },
        borderGray: {
          DEFAULT: "hsl(var(--border))",
          light: "hsl(var(--border))",
          dark: "hsl(var(--border))",
        },
        brandGold: {
          DEFAULT: "hsl(var(--accent))",
          light: "hsl(var(--accent))",
          dark: "hsl(var(--accent))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "cooking-bg": "hsl(var(--cooking-bg))",
        "sidebar-bg": "hsl(var(--sidebar-bg))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "warm-sm":
          "0 1px 2px 0 rgba(41, 33, 25, 0.05)",
        "warm-md":
          "0 4px 6px -1px rgba(41, 33, 25, 0.08), 0 2px 4px -2px rgba(41, 33, 25, 0.05)",
        "warm-lg":
          "0 10px 15px -3px rgba(41, 33, 25, 0.08), 0 4px 6px -4px rgba(41, 33, 25, 0.04)",
        "warm-glow":
          "0 0 15px rgba(255, 56, 92, 0.15)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      transitionTimingFunction: {
        "ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
