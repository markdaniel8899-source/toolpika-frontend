import { Instrument_Serif, Inter, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Body / UI typeface - clean, neutral, highly readable.
 * Loaded as --font-inter; weights 400, 500 and 600 used across the UI.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * Navigation / UI accent typeface — the font used for the nav labels in the
 * high-end mockup.
 */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * Display / accent typeface - editorial serif for hero highlights.
 * Used for the italic accent word and other short display moments.
 * Loaded as --font-display.
 */
export const display = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  style: "italic",
  display: "swap",
});
