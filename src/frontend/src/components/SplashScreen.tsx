import { DevelvynLogo } from "@/components/DevelvynLogo";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);
  const isFirstVisit = !localStorage.getItem("develvyn_splash_seen");

  useEffect(() => {
    if (!isFirstVisit) {
      // Returning visit: quick pulse then done
      const t = setTimeout(() => {
        onComplete();
      }, 900);
      return () => clearTimeout(t);
    }
    // First visit: animated story sequence
    const timers = [
      setTimeout(() => setPhase(1), 100), // logo scales in
      setTimeout(() => setPhase(2), 800), // tagline fades in
      setTimeout(() => setPhase(3), 1500), // mode icons float up
      setTimeout(() => setPhase(4), 2200), // all hold
      setTimeout(() => {
        localStorage.setItem("develvyn_splash_seen", "1");
        onComplete();
      }, 3100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete, isFirstVisit]);

  if (!isFirstVisit) {
    // Micro-animation for returning visits
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "#FFFFFF" }}
        data-ocid="splash.page"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.8] }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <DevelvynLogo size={56} />
        </motion.div>
        <motion.div
          className="absolute rounded-full"
          initial={{ width: 56, height: 56, opacity: 0.6 }}
          animate={{ width: 120, height: 120, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ backgroundColor: "#22C55E" }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: "#FFFFFF" }}
      data-ocid="splash.page"
    >
      {/* Skip button */}
      <button
        type="button"
        onClick={() => {
          localStorage.setItem("develvyn_splash_seen", "1");
          onComplete();
        }}
        className="absolute top-12 right-6 text-sm font-medium"
        style={{ color: "#22C55E" }}
        data-ocid="splash.close_button"
      >
        Skip
      </button>

      <div className="flex flex-col items-center gap-5 px-8 text-center">
        {/* Phase 1: Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={
            phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }
          }
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <DevelvynLogo size={80} />
        </motion.div>

        {/* Phase 2: Brand text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#111827" }}
          >
            Develvyn
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: "#22C55E" }}>
            The Family Suite
          </p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            by Develvyn Technologies Pvt Ltd
          </p>
        </motion.div>

        {/* Phase 3: Mode icons float up */}
        {phase >= 3 && (
          <div className="flex gap-8 mt-2">
            {[
              { icon: "🏢", label: "Apartment" },
              { icon: "👨\u200D👩\u200D👧", label: "Family" },
              { icon: "🔒", label: "Watchman" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.45 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{item.icon}</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#6B7280" }}
                >
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
