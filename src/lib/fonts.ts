import { Inter, Playfair_Display } from "next/font/google";

/**
 * Body / UI typeface — clean, neutral, highly readable.
 * Loaded as --font-inter; weights 400 and 500 used across the UI.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Display / accent typeface — elegant serif for hero highlights.
 * Used for the italic "seconds" word and other accent highlights.
 */
export const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  style: "italic",
  display: "swap",
});
