import { Playfair_Display, Source_Sans_3, Comfortaa } from "next/font/google";

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-logo",
  display: "swap",
});
