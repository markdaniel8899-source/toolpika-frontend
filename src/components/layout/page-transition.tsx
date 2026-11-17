"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

/**
 * Route-aware page transition.
 *
 * - Only the page content animates; Header / Footer stay static.
 * - Cross-page navigation: fade-up entry, fade-down exit.
 * - Respects prefers-reduced-motion (Framer Motion disables automatically).
 * - initial={false} on first mount avoids layout shift / FOUC on first paint.
 */
const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  hover: { opacity: 1, y: 0 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={false}
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 28,
          duration: 0.4,
        }}
        className="min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
