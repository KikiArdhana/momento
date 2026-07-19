"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, Heart, Sparkles } from "lucide-react";

type LoginSuccessProps = {
  mode: "signin" | "signup";
  onDone: () => void;
};

/**
 * The post-login moment: a camera pops in, the flash fires, and a
 * polaroid "prints" and develops with a welcome note — then the app
 * opens. ~2.5s (instant-ish for reduced-motion users).
 */
export function LoginSuccess({ mode, onDone }: LoginSuccessProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 700 : 2500);
    return () => clearTimeout(t);
  }, [onDone, reduce]);

  const caption = mode === "signup" ? "Your book begins" : "Welcome back";

  if (reduce) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-paper"
        role="status"
        aria-label={caption}
      >
        <p className="chapter-heading text-3xl text-ink">{caption} ✨</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 overflow-hidden bg-paper"
      role="status"
      aria-label={caption}
    >
      {/* Camera pops in, does a tiny "snap" squeeze right before the flash */}
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: [0, 1.06, 1, 1, 0.92, 1], rotate: [-12, 0, 0, 0, 0, 0] }}
        transition={{ duration: 1.1, times: [0, 0.35, 0.5, 0.72, 0.82, 1], ease: "easeOut" }}
        className="flex size-20 items-center justify-center rounded-3xl bg-ink shadow-lifted"
      >
        <Camera className="size-9 text-paper" strokeWidth={1.75} aria-hidden />
      </motion.div>

      {/* The flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: 1.35, times: [0, 0.78, 0.85, 1] }}
        className="pointer-events-none absolute inset-0 bg-white"
        aria-hidden
      />

      {/* The polaroid prints out and develops */}
      <motion.div
        initial={{ opacity: 0, y: -26, rotate: 7, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, rotate: -3, scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 220, damping: 17 }}
        className="rounded-xl bg-card p-3 pb-4 shadow-lifted"
      >
        <div className="relative flex h-40 w-44 items-center justify-center overflow-hidden rounded-lg bg-sand-deep">
          {/* "Developing" reveal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.45, duration: 0.9, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blush via-paper to-sand"
          >
            <Heart className="size-12 fill-rose text-rose" aria-hidden />
            <motion.span
              className="absolute right-6 top-6"
              animate={{ scale: [0.7, 1.15, 0.7], rotate: [0, 12, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
            >
              <Sparkles className="size-5 text-rose-deep" aria-hidden />
            </motion.span>
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.4 }}
          className="chapter-heading mt-3 text-center text-xl text-ink"
        >
          {caption}
        </motion.p>
      </motion.div>

      {/* Footnote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.4 }}
        className="text-sm text-stone"
      >
        Opening your memory book…
      </motion.p>
    </motion.div>
  );
}