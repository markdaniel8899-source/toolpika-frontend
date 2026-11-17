import { Inter } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Big Apple NF — single weight (400), Nick's Fonts license.
 * Served as the original OTF on purpose: the EULA forbids modification,
 * so do not convert or subset the file.
 */
export const bigApple = localFont({
  src: "../../public/fonts/bigapple/BigAppleNF.otf",
  variable: "--font-big-apple",
  weight: "400",
  style: "normal",
  display: "swap",
});
