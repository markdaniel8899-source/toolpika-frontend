import { Inter, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Body / UI typeface — clean, neutral, highly readable.
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Display / accent typeface — contrasting geometric sans for logo,
 * hero headings and section titles only. Replaces Big Apple NF.
 * Single weight 400; never pair with font-bold.
 */
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  style: "normal",
  display: "swap",
});
