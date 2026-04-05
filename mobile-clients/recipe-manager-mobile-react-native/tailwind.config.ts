/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Warm Mediterranean palette
        background: {
          light: "#F9F6F1",
          dark: "#1C1917",
          DEFAULT: "#F9F6F1",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#292524",
          DEFAULT: "#FFFFFF",
        },
        foreground: {
          light: "#292119",
          dark: "#F5F0EB",
          DEFAULT: "#292119",
        },
        muted: {
          light: "#78716C",
          dark: "#A8A29E",
          DEFAULT: "#78716C",
        },
        border: {
          light: "#E7E0D8",
          dark: "#44403C",
          DEFAULT: "#E7E0D8",
        },
        primary: {
          light: "#FF385C",
          dark: "#FF385C",
          DEFAULT: "#FF385C",
        },
        accent: {
          light: "#F0960A",
          dark: "#F0960A",
          DEFAULT: "#F0960A",
        },
        success: {
          light: "#38A862",
          dark: "#38A862",
          DEFAULT: "#38A862",
        },

        // Legacy aliases for backward compat during migration
        brand: {
          light: "#FF385C",
          dark: "#FF385C",
          DEFAULT: "#FF385C",
        },
        inputGray: {
          DEFAULT: "#F2EDE7",
          light: "#F2EDE7",
          dark: "#292524",
        },
        backgroundGray: {
          light: "#F9F6F1",
          dark: "#1C1917",
          DEFAULT: "#F9F6F1",
        },
        borderGray: {
          light: "#E7E0D8",
          dark: "#44403C",
          DEFAULT: "#E7E0D8",
        },
        brandGold: {
          DEFAULT: "#F0960A",
          light: "#FEF3E2",
          dark: "#44403C",
        },
        brandGreen: {
          light: "#38A862",
          dark: "#38A862",
        },
        systemGray4: {
          DEFAULT: "#A8A29E",
          light: "#78716C",
          dark: "#A8A29E",
        },
        systemGray5: {
          DEFAULT: "#F2EDE7",
          light: "#F2EDE7",
          dark: "#44403C",
        },
      },
      fontFamily: {
        heading: ["PlayfairDisplay_700Bold"],
        "heading-semibold": ["PlayfairDisplay_600SemiBold"],
        "heading-regular": ["PlayfairDisplay_400Regular"],
        body: ["SourceSans3_400Regular"],
        "body-medium": ["SourceSans3_500Medium"],
        "body-semibold": ["SourceSans3_600SemiBold"],
        brand: ["Comfortaa_700Bold"],
      },
    },
  },
  plugins: [],
};
