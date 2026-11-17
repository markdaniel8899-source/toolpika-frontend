import { Inter } from "next/font/google";

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
