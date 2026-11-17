import { Inter } from "next/font/google";
import localFont from "next/font/local";

/**
 * Body / UI typeface — clean, neutral, highly readable.
 * Loaded as --font-body; weights 400 and 500 used across the UI.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Heading / accent typeface — Big Apple NF (local file).
 * EULA: single weight 400, never bold, never converted/subset.
 * Loaded as --font-heading; always rendered font-normal.
 * Minimum 28px — hairlines disappear below that.
 */
export const heading = localFont({
  src: "../../public/fonts/bigapple/BigAppleNF.otf",
  variable: "--font-heading",
  weight: "400",
  style: "normal",
  display: "swap",
});
