import { Platform } from "react-native";

/**
 * Liquid glass design tokens. These values were extracted from the
 * floating pill nav so existing surfaces keep their exact appearance.
 * All glass surfaces should consume these via <GlassView /> rather than
 * hand-rolling BlurView styling.
 */

export const liquidGlassShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  android: {
    elevation: 12,
  },
  default: {},
});

export const glassIntensity = {
  regular: 90,
  strong: 120,
} as const;

export type GlassIntensity = keyof typeof glassIntensity;

export const glassTint = (colorScheme: "light" | "dark" | null | undefined) =>
  colorScheme === "dark"
    ? ("systemChromeMaterialDark" as const)
    : ("systemChromeMaterialLight" as const);

export const glassFill = "bg-white/15 dark:bg-white/[0.08]";
export const glassBorder = "border-[0.5px] border-white/30 dark:border-white/15";
export const glassHighlight = "bg-white/20 dark:bg-white/10";

/** Warm scrim behind glass modals */
export const glassScrim = "bg-zinc-900/60 dark:bg-zinc-900/80";

/** Opaque warm surface used when blur is unavailable (Android, reduce transparency) */
export const glassFallback =
  "bg-white dark:bg-[#262220] border-[0.5px] border-black/5 dark:border-white/10";
