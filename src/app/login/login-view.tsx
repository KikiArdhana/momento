"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Camera, Flower2, Heart, Sparkles, type LucideIcon } from "lucide-react";
import { EmailAuthForm } from "./email-auth-form";
import { cn } from "@/lib/utils";

/**
 * The book's cover, dressed like a scrapbook desk: little polaroids
 * drifting around the form, a header that settles in softly.
 */
export function LoginView() {
  const reduce = useReducedMotion();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-14">
      {/* Drifting polaroids */}
      <Polaroid icon={Camera}  className="left-[6%] top-[7%]"                      rotate={-8} delay={0.1} />
      <Polaroid icon={Flower2} className="right-[7%] top-[10%]"                    rotate={7}  delay={0.3} />
      <Polaroid icon={Heart}   className="bottom-[16%] left-[9%] hidden sm:block"  rotate={5}  delay={0.5} />
      <Polaroid icon={Sparkles} className="bottom-[10%] right-[10%] hidden sm:block" rotate={-6} delay={0.7} />

      {/* Tiny twinkles */}
      <Twinkle className="left-[22%] top-[24%]" delay={0} />
      <Twinkle className="right-[24%] top-[32%]" delay={1.1} />
      <Twinkle className="bottom-[26%] left-[30%] hidden sm:block" delay={0.6} />

      <div className="relative z-10 w-full max-w-sm text-center">
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-medium uppercase tracking-[0.2em] text-rose"
          >
            A memory book
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="chapter-heading mt-3 text-6xl text-ink"
          >
            Momento
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-[260px] text-[15px] leading-relaxed text-stone"
          >
            Your special memories, brought together into stories worth remembering.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10">
            <EmailAuthForm />
          </motion.div>
        </motion.div>
      </div>

      <p className="relative z-10 mt-10 text-xs text-stone/70">©KikiArdhana</p>
    </main>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

function Polaroid({
  icon: Icon,
  className,
  rotate,
  delay,
}: {
  icon: LucideIcon;
  className: string;
  rotate: number;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      initial={reduce ? false : { opacity: 0, y: 16, rotate: rotate * 2 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ delay, duration: 0.7, ease: "easeOut" }}
      className={cn("absolute z-0", className)}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -9, 0], rotate: [rotate, rotate + 2, rotate] }}
        transition={{ duration: 4.5 + delay * 2, repeat: Infinity, ease: "easeInOut", delay }}
        className="rounded-lg bg-card p-1.5 pb-5 shadow-lifted"
      >
        <div className="flex size-12 items-center justify-center rounded-md bg-blush sm:size-14">
          <Icon className="size-5 text-rose-deep sm:size-6" strokeWidth={1.75} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Twinkle({ className, delay }: { className: string; delay: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.span
      aria-hidden
      className={cn("absolute z-0 size-1.5 rounded-full bg-rose/60", className)}
      animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.25, 0.9, 0.25] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}