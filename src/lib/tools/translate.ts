/**
 * Minimal structural type for a next-intl translator. It lets pure helpers
 * like tool-content.ts stay free of React hooks while still being usable with
 * both `useTranslations` (client) and `getTranslations` (server).
 */
export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;
