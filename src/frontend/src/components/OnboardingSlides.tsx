import { Building2, Home, Lock, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const SLIDES = [
  {
    id: 1,
    icon: Building2,
    title: "Manage Your Apartment",
    subtitle: "Apartment Mode",
    description:
      "Track maintenance payments, manage visitor logs, post notices, and keep your apartment running smoothly — with full audit trails.",
    color: "#22C55E",
    lightBg: "#F0FDF4",
  },
  {
    id: 2,
    icon: Home,
    title: "Family, Simplified",
    subtitle: "Family Mode",
    description:
      "Track family expenses, manage tasks, grocery lists, and reminders — completely private, visible only to your household.",
    color: "#16A34A",
    lightBg: "#DCFCE7",
  },
  {
    id: 3,
    icon: Shield,
    title: "Watchman, Powered Up",
    subtitle: "Watchman Mode",
    description:
      "Icon-only interface for watchmen. Log visitors, update gate and motor status, start and end shifts — all with large, easy-to-tap buttons.",
    color: "#059669",
    lightBg: "#ECFDF5",
  },
  {
    id: 4,
    icon: Lock,
    title: "Your Privacy, Our Promise",
    subtitle: "DPDP Compliant",
    description:
      "Your data stays yours. Strict mode boundaries — your watchman cannot see family data. Full DPDP compliance. Right to access and delete, always.",
    color: "#22C55E",
    lightBg: "#F0FDF4",
  },
];

interface OnboardingSlidesProps {
  onComplete: () => void;
}

export function OnboardingSlides({ onComplete }: OnboardingSlidesProps) {
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const goNext = () => (isLast ? onComplete() : setCurrent((c) => c + 1));
  const Icon = slide.icon;

  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      data-ocid="onboarding.page"
    >
      <div className="flex justify-end p-5">
        <button
          type="button"
          onClick={onComplete}
          className="text-sm font-medium"
          style={{ color: "#6B7280" }}
          data-ocid="onboarding.close_button"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-col items-center text-center gap-6"
          >
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: slide.lightBg }}
            >
              <Icon size={52} style={{ color: slide.color }} />
            </div>
            <div className="flex flex-col gap-2 max-w-xs">
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: slide.color }}
              >
                {slide.subtitle}
              </p>
              <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>
                {slide.title}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#6B7280" }}
              >
                {slide.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-5 px-8 pb-12">
        <div className="flex gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setCurrent(i)}
              className="rounded-full transition-smooth"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                backgroundColor: i === current ? "#22C55E" : "#DCFCE7",
              }}
              data-ocid={`onboarding.dot.${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={goNext}
          className="w-full max-w-xs py-3.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#22C55E", color: "#FFFFFF" }}
          data-ocid="onboarding.next_button"
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
