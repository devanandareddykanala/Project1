import { createActor } from "@/backend";
import {
  AlertType,
  GateStatus,
  LiftStatus,
  VisitorType,
  WaterMotorStatus,
} from "@/backend";
import { WatchmanStatusWidget } from "@/components/WatchmanStatusWidget";
import { useAuthStore } from "@/store/auth";
import type { SOSAlert, Visitor } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Coffee,
  MoonStar,
  Package,
  Phone,
  Play,
  Shield,
  Siren,
  StopCircle,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Flat option type ─────────────────────────────────────────
interface FlatOption {
  flatId: string;
  flatNumber: string;
}

const HANDOVER_NOTES = [
  "All clear",
  "Lift issue noted",
  "Water motor timing adjusted",
  "Stranger near gate",
  "Package left at gate",
  "Other",
];

type StatusKey = "gate" | "water" | "lift" | "cleaning";
type GateState = "open" | "closed" | "locked";
type LiftState = "ok" | "issue" | "offline";
export type { GateState, LiftState };
type VisitorTypeLocal = "guest" | "delivery" | "service" | "unknown";
type Section = "main" | "visitor" | "delivery" | "handover" | "night" | "sos";

function isNightHour() {
  const h = new Date().getHours();
  return h >= 23 || h < 6;
}

interface ExtendedStatus {
  gate: GateState;
  water: boolean;
  lift: LiftState;
  cleaning: boolean;
  lastUpdatedAt: number;
  lastUpdatedBy: string;
}

interface HandoverCheck {
  gateLocked: boolean | null;
  motorOff: boolean | null;
  liftOk: boolean | null;
  note: string;
}

// ─── Enum helpers ─────────────────────────────────────────────
function toGateStatus(g: GateState): GateStatus {
  if (g === "open") return GateStatus.Open;
  if (g === "locked") return GateStatus.Locked;
  return GateStatus.Closed;
}

function toLiftStatus(l: LiftState): LiftStatus {
  if (l === "ok") return LiftStatus.OK;
  if (l === "offline") return LiftStatus.Offline;
  return LiftStatus.Issue;
}

function toVisitorType(v: VisitorTypeLocal): VisitorType {
  if (v === "guest") return VisitorType.Guest;
  if (v === "delivery") return VisitorType.Delivery;
  if (v === "service") return VisitorType.Service;
  return VisitorType.Unknown;
}

function toAlertType(t: SOSAlert["type"]): AlertType {
  if (t === "medical") return AlertType.Medical;
  if (t === "fire") return AlertType.Fire;
  if (t === "safety") return AlertType.Safety;
  return AlertType.Other;
}

// ─── Helper ───────────────────────────────────────────────────
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Action Button ────────────────────────────────────────────
interface ActionBtnProps {
  icon: React.FC<{
    size?: number;
    style?: React.CSSProperties;
  }>;
  onTap: () => void;
  accent?: string;
  ocid: string;
  disabled?: boolean;
  variant?: "sos" | "default";
  active?: boolean;
}

function ActionBtn({
  icon: Icon,
  onTap,
  accent = "#22C55E",
  ocid,
  disabled,
  variant = "default",
  active = false,
}: ActionBtnProps) {
  const isSOS = variant === "sos";
  const bg = "#FFFFFF";
  const borderColor = isSOS ? "#FCA5A5" : active ? "#22C55E" : "#E5E7EB";
  const iconColor = isSOS ? "#EF4444" : disabled ? "#D1D5DB" : accent;

  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onTap}
      whileTap={disabled ? {} : { scale: 0.93 }}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all"
      style={{
        minHeight: "88px",
        width: "100%",
        backgroundColor: disabled ? "#F9FAFB" : bg,
        border: `2px solid ${disabled ? "#E5E7EB" : borderColor}`,
        boxShadow: isSOS
          ? "0 0 16px rgba(239,68,68,0.12)"
          : active
            ? "0 0 12px rgba(34,197,94,0.12)"
            : "none",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      data-ocid={ocid}
    >
      <Icon size={36} style={{ color: iconColor }} />
    </motion.button>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────
function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full"
                style={{ backgroundColor: "#F3F4F6" }}
                data-ocid="watchman.sheet.close_button"
              >
                <X size={22} style={{ color: "#6B7280" }} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Big Choice Button ────────────────────────────────────────
function ChoiceBtn({
  label,
  selected,
  onTap,
  color = "#F59E0B",
  ocid,
}: {
  label: string;
  selected: boolean;
  onTap: () => void;
  color?: string;
  ocid: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onTap}
      whileTap={{ scale: 0.96 }}
      className="flex items-center justify-center rounded-2xl min-h-[64px] text-lg font-bold w-full transition-all"
      style={{
        backgroundColor: selected ? `${color}18` : "#F9FAFB",
        border: `2px solid ${selected ? color : "#E5E7EB"}`,
        color: selected ? color : "#6B7280",
      }}
      data-ocid={ocid}
    >
      {label}
    </motion.button>
  );
}

// ─── SOS Hold Button ──────────────────────────────────────────
function SOSHoldButton({ onTriggered }: { onTriggered: () => void }) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = () => {
    setProgress(0);
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 100;
        }
        return p + 4;
      });
    }, 120);
    holdTimer.current = setTimeout(() => {
      onTriggered();
      cancelHold();
    }, 3000);
  };

  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-base font-semibold" style={{ color: "#6B7280" }}>
        Hold 3 seconds to activate SOS
      </p>
      <div className="relative w-40 h-40">
        <svg
          className="absolute inset-0"
          width="160"
          height="160"
          viewBox="0 0 160 160"
        >
          <title>SOS progress ring</title>
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="#FCA5A5"
            strokeWidth="6"
          />
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="#EF4444"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 72}`}
            strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress / 100)}`}
            transform="rotate(-90 80 80)"
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>
        <motion.button
          type="button"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onTouchStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          whileTap={{ scale: 0.95 }}
          className="absolute inset-3 rounded-full flex flex-col items-center justify-center gap-1 sos-pulse"
          style={{
            backgroundColor: "#EF4444",
            border: "3px solid #B91C1C",
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
            WebkitTouchCallout: "none",
          }}
          data-ocid="watchman.sos.hold_button"
        >
          <Siren size={40} style={{ color: "#FFFFFF" }} />
          <span className="text-xs font-bold" style={{ color: "#FFFFFF" }}>
            SOS
          </span>
        </motion.button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function WatchmanHome() {
  const user = useAuthStore((s) => s.user);
  const watchmanName = user?.name ?? "Watchman";
  const { actor } = useActor(createActor);

  // ── Flats (dynamic from backend) ──────────────────────────────
  const [flats, setFlats] = useState<FlatOption[]>([]);

  useEffect(() => {
    if (!actor || !user?.apartmentId) return;
    actor
      .getFlats(BigInt(user.apartmentId))
      .then((result) => {
        setFlats(
          result.map((f) => ({
            flatId: f.id.toString(),
            flatNumber: f.flatNumber,
          })),
        );
      })
      .catch(() => {});
  }, [actor, user?.apartmentId]);

  // ── Shift state ──────────────────────────────────────────────
  const [activeWatchmanTab, setActiveWatchmanTab] = useState<"duty" | "status">(
    "duty",
  );
  const [onDuty, setOnDuty] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<bigint | null>(null);
  const [shiftStart, setShiftStart] = useState<number | null>(null);
  const [section, setSection] = useState<Section>("main");
  const [nightMode, setNightMode] = useState(false);

  // ── Rest state ──────────────────────────────────────────────
  const [isResting, setIsResting] = useState(false);
  const [_restStart, setRestStart] = useState<number | null>(null);
  const [restElapsed, setRestElapsed] = useState(0);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartRest = () => {
    setIsResting(true);
    setRestStart(Date.now());
    restTimerRef.current = setInterval(() => {
      setRestElapsed((prev) => prev + 1);
    }, 1000);
  };

  const handleEndRest = () => {
    setIsResting(false);
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    const mins = Math.floor(restElapsed / 60);
    toast.success(`Rest ended — ${mins} min logged for transparency.`, {
      duration: 4000,
    });
    setRestElapsed(0);
    setRestStart(null);
  };

  const formatRestTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Facility status (real from backend) ──────────────────────
  const [status, setStatus] = useState<ExtendedStatus>({
    gate: "open",
    water: true,
    lift: "ok",
    cleaning: false,
    lastUpdatedAt: Date.now(),
    lastUpdatedBy: watchmanName,
  });

  // Load facility status + check active shift on mount
  useEffect(() => {
    if (!actor || !user?.apartmentId) return;
    const aptId = BigInt(user.apartmentId);

    actor
      .getFacilityStatus(aptId)
      .then((fs) => {
        if (!fs) return;
        setStatus({
          gate:
            fs.gateStatus === GateStatus.Open
              ? "open"
              : fs.gateStatus === GateStatus.Locked
                ? "locked"
                : "closed",
          water: fs.waterMotorStatus === WaterMotorStatus.On,
          lift:
            fs.liftStatus === LiftStatus.OK
              ? "ok"
              : fs.liftStatus === LiftStatus.Offline
                ? "offline"
                : "issue",
          cleaning: (fs.cleaningStatus as unknown as string) === "Done",
          lastUpdatedAt: Number(fs.lastUpdatedAt) / 1_000_000,
          lastUpdatedBy: watchmanName,
        });
      })
      .catch(() => {});

    actor
      .getActiveShift(aptId)
      .then((shift) => {
        if (shift) {
          setOnDuty(true);
          setActiveShiftId(shift.id);
          setShiftStart(Number(shift.startedAt) / 1_000_000);
          setNightMode(shift.isNightMode);
        }
      })
      .catch(() => {});
  }, [actor, user?.apartmentId, watchmanName]);

  // Poll facility status every 30 seconds
  useEffect(() => {
    if (!actor || !user?.apartmentId) return;
    const aptId = BigInt(user.apartmentId);
    const interval = setInterval(() => {
      actor
        .getFacilityStatus(aptId)
        .then((fs) => {
          if (!fs) return;
          setStatus((prev) => ({
            gate:
              fs.gateStatus === GateStatus.Open
                ? "open"
                : fs.gateStatus === GateStatus.Locked
                  ? "locked"
                  : "closed",
            water: fs.waterMotorStatus === WaterMotorStatus.On,
            lift:
              fs.liftStatus === LiftStatus.OK
                ? "ok"
                : fs.liftStatus === LiftStatus.Offline
                  ? "offline"
                  : "issue",
            cleaning: (fs.cleaningStatus as unknown as string) === "Done",
            lastUpdatedAt: Number(fs.lastUpdatedAt) / 1_000_000,
            lastUpdatedBy: prev.lastUpdatedBy,
          }));
        })
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [actor, user?.apartmentId]);

  // No-duty warning: if hour >= 8 and no active shift
  const currentHour = new Date().getHours();
  const showNoDutyWarning = currentHour >= 8 && !onDuty && !nightMode;

  // ── Visitor form ────────────────────────────────────────────
  const [visitorType, setVisitorType] = useState<VisitorTypeLocal | null>(null);
  const [visitorFlat, setVisitorFlat] = useState<FlatOption | null>(null);

  // ── Delivery form ───────────────────────────────────────────
  const [deliveryFlat, setDeliveryFlat] = useState<FlatOption | null>(null);

  // ── Handover ────────────────────────────────────────────────
  const [handover, setHandover] = useState<HandoverCheck>({
    gateLocked: null,
    motorOff: null,
    liftOk: null,
    note: "",
  });

  // ── SOS ─────────────────────────────────────────────────────
  const [sosType, setSosType] = useState<SOSAlert["type"] | null>(null);
  const [sosConfirmed, setSosConfirmed] = useState(false);

  // ── Visitor log (in-memory display) ─────────────────────────
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  const nightNow = isNightHour();

  // ── Visitor edit window tracking ──────────────────────────────
  const [_editingVisitorId, _setEditingVisitorId] = useState<string | null>(
    null,
  );

  const canEditVisitor = (loggedAt: number) => {
    return Date.now() - loggedAt < 30 * 60 * 1000; // 30-min window
  };

  const handleMarkExit = (visitorId: string) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitorId ? { ...v, status: "out" } : v)),
    );
    toast.success("Exit marked.", { duration: 2000 });
  };

  // ── Status sync to backend ───────────────────────────────────
  const syncFacilityStatus = useCallback(
    (next: ExtendedStatus) => {
      if (!actor || !user?.apartmentId) return;
      actor
        .updateFacilityStatus(
          BigInt(user.apartmentId),
          toGateStatus(next.gate),
          next.water ? WaterMotorStatus.On : WaterMotorStatus.Off,
          toLiftStatus(next.lift),
          (next.cleaning ? "Done" : "Pending") as never,
        )
        .catch(() => {});
    },
    [actor, user?.apartmentId],
  );

  const updateStatus = useCallback(
    (key: StatusKey, val: unknown) => {
      setStatus((s) => {
        const next = {
          ...s,
          [key]: val,
          lastUpdatedAt: Date.now(),
          lastUpdatedBy: watchmanName,
        };
        syncFacilityStatus(next);
        return next;
      });
    },
    [watchmanName, syncFacilityStatus],
  );

  const cycleGate = () => {
    setStatus((s) => {
      const next = {
        ...s,
        gate: (s.gate === "open"
          ? "closed"
          : s.gate === "closed"
            ? "locked"
            : "open") as GateState,
        lastUpdatedAt: Date.now(),
        lastUpdatedBy: watchmanName,
      };
      syncFacilityStatus(next);
      return next;
    });
  };

  const cycleLift = () => {
    setStatus((s) => {
      const next = {
        ...s,
        lift: (s.lift === "ok"
          ? "issue"
          : s.lift === "issue"
            ? "offline"
            : "ok") as LiftState,
        lastUpdatedAt: Date.now(),
        lastUpdatedBy: watchmanName,
      };
      syncFacilityStatus(next);
      return next;
    });
  };

  // ── Shift start with GPS ─────────────────────────────────────
  const handleStartDuty = () => {
    if (!actor || !user?.apartmentId || !user?.id) return;
    const aptId = BigInt(user.apartmentId);
    const userId = BigInt(user.id);

    const doStart = () => {
      actor
        .startShift(aptId, userId)
        .then(() => actor.getActiveShift(aptId))
        .then((shift) => {
          setOnDuty(true);
          setShiftStart(Date.now());
          if (shift) setActiveShiftId(shift.id);
          toast.success(`Duty started — ${watchmanName}`, { duration: 3000 });
        })
        .catch(() => {
          toast.error("Failed to start shift. Try again.", { duration: 4000 });
        });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => doStart(),
        () => doStart(),
        { timeout: 5000 },
      );
    } else {
      doStart();
    }
  };

  const handleEndDutyTap = () => {
    setHandover({ gateLocked: null, motorOff: null, liftOk: null, note: "" });
    setSection("handover");
  };

  const canEndShift =
    handover.gateLocked === true &&
    handover.motorOff === true &&
    handover.liftOk !== null;

  const handleEndShift = () => {
    const doEnd = () => {
      setOnDuty(false);
      setShiftStart(null);
      setActiveShiftId(null);
      if (nightNow) {
        setNightMode(true);
        setSection("night");
      } else {
        setSection("main");
      }
      toast.success("Shift ended. Handover recorded.", { duration: 4000 });
    };

    if (!actor || !activeShiftId) {
      doEnd();
      return;
    }

    actor
      .endShift(activeShiftId, handover.note, {
        gateChecked: handover.gateLocked === true,
        motorChecked: handover.motorOff === true,
        liftChecked: handover.liftOk === true,
      })
      .then(doEnd)
      .catch(() => {
        toast.error("Failed to end shift. Try again.", { duration: 4000 });
      });
  };

  const handleLogVisitor = () => {
    if (!visitorType || !visitorFlat || !actor || !user?.apartmentId) return;
    const aptId = BigInt(user.apartmentId);
    const flatId = BigInt(visitorFlat.flatId);

    actor
      .logVisitor(flatId, aptId, visitorType, toVisitorType(visitorType), "")
      .then(() => {
        const isNight = isNightHour();
        const v: Visitor = {
          id: `v${Date.now()}`,
          apartmentId: user.apartmentId ?? "",
          flatId: visitorFlat.flatId,
          flatNumber: visitorFlat.flatNumber,
          name: visitorType.charAt(0).toUpperCase() + visitorType.slice(1),
          type: visitorType,
          loggedBy: watchmanName,
          loggedAt: Date.now(),
          status: "in",
          isNightEntry: isNight,
        } as Visitor & { isNightEntry?: boolean };
        setVisitors((prev) => [v, ...prev]);
        setVisitorType(null);
        setVisitorFlat(null);
        setSection("main");
        toast.success(`${v.type} logged for Flat ${visitorFlat.flatNumber}`, {
          duration: 3000,
        });
      })
      .catch(() => {
        toast.error("Failed to log visitor. Try again.", { duration: 4000 });
      });
  };

  const handleLogDelivery = () => {
    if (!deliveryFlat || !actor || !user?.apartmentId) return;
    const aptId = BigInt(user.apartmentId);
    const flatId = BigInt(deliveryFlat.flatId);

    actor
      .logVisitor(flatId, aptId, "Delivery", VisitorType.Delivery, "")
      .then(() => {
        const isNight = isNightHour();
        const v: Visitor = {
          id: `v${Date.now()}`,
          apartmentId: user.apartmentId ?? "",
          flatId: deliveryFlat.flatId,
          flatNumber: deliveryFlat.flatNumber,
          name: "Delivery",
          type: "delivery",
          loggedBy: watchmanName,
          loggedAt: Date.now(),
          status: "in",
          isNightEntry: isNight,
        } as Visitor & { isNightEntry?: boolean };
        setVisitors((prev) => [v, ...prev]);
        setDeliveryFlat(null);
        setSection("main");
        toast.success(`Delivery logged for Flat ${deliveryFlat.flatNumber}`, {
          duration: 3000,
        });
      })
      .catch(() => {
        toast.error("Failed to log delivery. Try again.", { duration: 4000 });
      });
  };

  const _handleSOSTrigger = () => {
    setSection("sos");
    setSosType(null);
    setSosConfirmed(false);
  };

  const handleSOSConfirm = () => {
    if (!sosType) return;

    const showSent = () => {
      setSosConfirmed(true);
      toast.error(
        `🚨 SOS ALERT — ${sosType.toUpperCase()} — Notifying all residents`,
        { duration: 10000 },
      );
    };

    if (!actor || !user?.apartmentId || !user?.flatId) {
      showSent();
      return;
    }

    actor
      .triggerSOS(
        BigInt(user.flatId),
        BigInt(user.apartmentId),
        toAlertType(sosType),
      )
      .then(showSent)
      .catch(showSent); // SOS is safety-critical — always show sent
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FFFFFF" }}
      data-ocid="watchman.page"
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          borderBottom: "1px solid #DCFCE7",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "#F0FDF4",
                border: "1.5px solid #86EFAC",
              }}
            >
              <Shield size={18} style={{ color: "#22C55E" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p
                  className="text-sm font-mono font-bold tracking-[0.15em] uppercase"
                  style={{ color: "#16A34A" }}
                >
                  DUTY MODE
                </p>
                {onDuty && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.6,
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#22C55E" }}
                  />
                )}
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {watchmanName}
              </p>
            </div>
          </div>
          <div className="text-right">
            {onDuty && shiftStart ? (
              <>
                <p
                  className="text-xs font-mono font-bold"
                  style={{ color: "#22C55E" }}
                >
                  ON DUTY
                </p>
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  since {fmtTime(shiftStart)}
                </p>
              </>
            ) : nightMode ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FCD34D",
                }}
              >
                <MoonStar size={13} style={{ color: "#F59E0B" }} />
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color: "#F59E0B" }}
                >
                  NIGHT
                </span>
              </div>
            ) : (
              <p className="text-xs font-mono" style={{ color: "#9CA3AF" }}>
                OFF DUTY
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── No-Duty Warning Banner ── */}
      {showNoDutyWarning && (
        <div
          className="mx-4 mt-3 rounded-xl px-4 py-2.5 flex items-center gap-2.5"
          style={{
            backgroundColor: "#FFFFFF",
            borderLeft: "4px solid #EF4444",
            border: "1px solid #FCA5A5",
          }}
          data-ocid="watchman.no_duty_warning"
        >
          <AlertTriangle size={16} style={{ color: "#EF4444" }} />
          <span
            className="text-sm font-mono font-bold tracking-wide"
            style={{ color: "#B91C1C" }}
          >
            NO DUTY STARTED
          </span>
          <span className="text-xs ml-1" style={{ color: "#EF4444" }}>
            · Tap START DUTY below
          </span>
        </div>
      )}

      {/* ── Night Mode Banner ── */}
      {nightMode && !onDuty && section !== "night" && (
        <div
          className="mx-4 mt-3 rounded-xl px-4 py-2.5 flex items-center gap-2.5"
          style={{
            backgroundColor: "#FFFFFF",
            borderLeft: "4px solid #F59E0B",
            border: "1px solid #FCD34D",
          }}
        >
          <MoonStar size={16} style={{ color: "#F59E0B" }} />
          <span
            className="text-sm font-mono font-bold tracking-wide"
            style={{ color: "#F59E0B" }}
          >
            NIGHT MODE ACTIVE
          </span>
          <span className="text-xs ml-1" style={{ color: "#D97706" }}>
            · Gate locked · Residents notified
          </span>
        </div>
      )}

      {/* ── Night Mode Screen ── */}
      {nightMode && !onDuty && section === "night" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col gap-5 p-5"
          data-ocid="watchman.night_mode.panel"
        >
          <div
            className="rounded-3xl p-6 flex flex-col items-center gap-4 text-center"
            style={{
              backgroundColor: "#FFFBEB",
              border: "2px solid #FCD34D",
            }}
          >
            <MoonStar size={56} style={{ color: "#F59E0B" }} />
            <h1 className="text-3xl font-bold" style={{ color: "#111827" }}>
              Night Mode Active
            </h1>
            <p className="text-base" style={{ color: "#6B7280" }}>
              Gate is locked. Residents have been notified.
            </p>
          </div>

          {/* SOS still available */}
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{
              backgroundColor: "#FEF2F2",
              border: "2px solid #FCA5A5",
            }}
          >
            <Siren size={36} style={{ color: "#EF4444" }} />
            <div>
              <p className="text-base font-bold" style={{ color: "#111827" }}>
                Emergency SOS Available
              </p>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Hold button 3 seconds in emergency
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setSection("sos");
            }}
            className="rounded-2xl min-h-[72px] font-bold text-lg flex items-center justify-center gap-3"
            style={{
              backgroundColor: "#FEF2F2",
              border: "2px solid #EF4444",
            }}
            data-ocid="watchman.night_sos.button"
          >
            <Siren size={28} style={{ color: "#EF4444" }} />
            <span style={{ color: "#B91C1C" }}>Open SOS</span>
          </motion.button>

          {/* Night events */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-3 font-semibold"
              style={{ color: "#9CA3AF" }}
            >
              Night Events
            </p>
            {visitors
              .filter((v) => v.loggedAt > (shiftStart ?? 0) - 3600000 * 6)
              .slice(0, 3).length === 0 ? (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                No events logged
              </p>
            ) : (
              visitors.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <Package size={18} style={{ color: "#9CA3AF" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {v.name} — Flat {v.flatNumber}
                  </span>
                  <span
                    className="ml-auto text-xs"
                    style={{ color: "#9CA3AF" }}
                  >
                    {fmtTime(v.loggedAt)}
                  </span>
                </div>
              ))
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setNightMode(false);
              setSection("main");
            }}
            className="rounded-2xl min-h-[72px] font-bold text-lg flex items-center justify-center gap-3"
            style={{
              backgroundColor: "#FFFBEB",
              border: "2px solid #F59E0B",
            }}
            data-ocid="watchman.night_exit.button"
          >
            <Play size={22} style={{ color: "#F59E0B" }} />
            <span style={{ color: "#D97706" }}>Start New Shift</span>
          </motion.button>
        </motion.div>
      )}

      {/* ── Status Panel ── */}
      {activeWatchmanTab === "status" && (
        <div className="flex-1 p-4" style={{ paddingBottom: "72px" }}>
          <WatchmanStatusWidget
            status={status}
            canTap={onDuty}
            onToggleGate={onDuty ? cycleGate : undefined}
            onToggleWater={
              onDuty ? () => updateStatus("water", !status.water) : undefined
            }
            onToggleLift={onDuty ? cycleLift : undefined}
            onToggleCleaning={
              onDuty
                ? () => updateStatus("cleaning", !status.cleaning)
                : undefined
            }
          />
        </div>
      )}

      {/* ── Main Screen ── */}
      {activeWatchmanTab !== "status" &&
        (section === "main" || !nightMode) &&
        section !== "night" && (
          <div
            className="flex-1 flex flex-col gap-4 p-4"
            style={{ paddingBottom: "72px" }}
          >
            {/* Duty Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onDuty ? handleEndDutyTap : handleStartDuty}
              className="w-full rounded-2xl flex items-center justify-center gap-3 font-bold text-xl transition-all"
              style={{
                minHeight: "80px",
                backgroundColor: onDuty ? "#EF4444" : "#22C55E",
                color: "#FFFFFF",
                border: "none",
              }}
              data-ocid="watchman.duty_toggle"
            >
              {onDuty ? (
                <>
                  <StopCircle size={30} /> ON DUTY — Tap to End
                </>
              ) : (
                <>
                  <Play size={30} /> START DUTY
                </>
              )}
            </motion.button>

            {/* Night Mode notice when applicable */}
            {nightNow && onDuty && (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FCD34D",
                }}
              >
                <MoonStar size={20} style={{ color: "#F59E0B" }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#D97706" }}
                >
                  Night hours — ending shift activates Night Mode
                </span>
              </div>
            )}

            {/* Status Board via widget */}
            <WatchmanStatusWidget
              status={status}
              canTap={onDuty}
              onToggleGate={onDuty ? cycleGate : undefined}
              onToggleWater={
                onDuty ? () => updateStatus("water", !status.water) : undefined
              }
              onToggleLift={onDuty ? cycleLift : undefined}
              onToggleCleaning={
                onDuty
                  ? () => updateStatus("cleaning", !status.cleaning)
                  : undefined
              }
            />

            {/* Log Entry — Step 1: big central button */}
            {onDuty && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setSection("visitor")}
                className="w-full rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all"
                style={{
                  minHeight: "72px",
                  backgroundColor: "#F0FDF4",
                  border: "2px solid #22C55E",
                  color: "#15803D",
                }}
                data-ocid="watchman.log_entry.button"
              >
                <Users size={24} />
                LOG ENTRY
              </motion.button>
            )}

            {/* Rest Button */}
            {onDuty && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={isResting ? handleEndRest : handleStartRest}
                className="w-full rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all"
                style={{
                  minHeight: "56px",
                  backgroundColor: isResting ? "#FFFBEB" : "#F9FAFB",
                  border: `2px solid ${isResting ? "#F59E0B" : "#E5E7EB"}`,
                  color: isResting ? "#D97706" : "#6B7280",
                }}
                data-ocid="watchman.rest.toggle"
              >
                {isResting ? (
                  <>
                    <Coffee size={20} /> END REST —{" "}
                    {formatRestTime(restElapsed)}
                  </>
                ) : (
                  <>
                    <BedDouble size={20} /> START REST
                  </>
                )}
              </motion.button>
            )}

            {/* Action Grid — icon-only, always visible */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-3"
              data-ocid="watchman.action_grid"
            >
              {/* VISITOR / DELIVERY / SOS */}
              <div className="flex flex-col items-center gap-1">
                <ActionBtn
                  icon={Users}
                  onTap={() => setSection("visitor")}
                  disabled={!onDuty}
                  accent="#22C55E"
                  ocid="watchman.visitor.button"
                />
                {!onDuty && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9CA3AF",
                      marginTop: "2px",
                      textAlign: "center",
                    }}
                  >
                    Start duty first
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <ActionBtn
                  icon={Package}
                  onTap={() => setSection("delivery")}
                  disabled={!onDuty}
                  accent="#22C55E"
                  ocid="watchman.delivery.button"
                />
                {!onDuty && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9CA3AF",
                      marginTop: "2px",
                      textAlign: "center",
                    }}
                  >
                    Start duty first
                  </p>
                )}
              </div>
              <ActionBtn
                icon={Siren}
                onTap={() => setSection("sos")}
                variant="sos"
                ocid="watchman.sos.button"
              />
            </motion.div>

            {/* Recent visitor log */}
            {visitors.length > 0 ? (
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DCFCE7",
                }}
                data-ocid="watchman.visitor_log.list"
              >
                <p
                  className="text-xs font-mono font-bold tracking-[0.18em] uppercase mb-3"
                  style={{ color: "#16A34A" }}
                >
                  TODAY'S LOG
                </p>
                {visitors.slice(0, 5).map((v, i) => {
                  const nightEntry = (v as Visitor & { isNightEntry?: boolean })
                    .isNightEntry;
                  const _editable = canEditVisitor(v.loggedAt);
                  return (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 py-3"
                      style={{
                        borderBottom:
                          i < Math.min(visitors.length, 5) - 1
                            ? "1px solid #F3F4F6"
                            : undefined,
                      }}
                      data-ocid={`watchman.log.item.${i + 1}`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor:
                            v.type === "delivery" ? "#EFF6FF" : "#F0FDF4",
                          border: `1px solid ${nightEntry ? "#FCD34D" : "#DCFCE7"}`,
                        }}
                      >
                        {v.type === "delivery" ? (
                          <Package size={18} style={{ color: "#3B82F6" }} />
                        ) : (
                          <User size={18} style={{ color: "#22C55E" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className="text-sm font-semibold capitalize"
                            style={{ color: "#111827" }}
                          >
                            {v.type}
                          </p>
                          {nightEntry && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "#FEF3C7",
                                color: "#D97706",
                              }}
                            >
                              🌙 NIGHT
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "#6B7280" }}>
                          Flat {v.flatNumber}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {v.status === "in" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkExit(v.id)}
                            className="text-xs font-bold px-2 py-1 rounded-lg transition-all"
                            style={{
                              backgroundColor: "#FEF2F2",
                              color: "#EF4444",
                              border: "1px solid #FCA5A5",
                            }}
                            data-ocid={`watchman.log.mark_exit.${i + 1}`}
                          >
                            Mark Exit
                          </button>
                        ) : (
                          <span
                            className="text-xs font-mono font-bold"
                            style={{ color: "#9CA3AF" }}
                          >
                            LEFT
                          </span>
                        )}
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {fmtTime(v.loggedAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 flex flex-col items-center gap-2"
                style={{
                  backgroundColor: "#F9FAFB",
                  border: "1px dashed #D1FAE5",
                }}
                data-ocid="watchman.visitor_log.empty_state"
              >
                <User size={28} style={{ color: "#9CA3AF" }} />
                <p className="text-sm" style={{ color: "#9CA3AF" }}>
                  No entries yet today
                </p>
              </div>
            )}
          </div>
        )}

      {/* ── Duty | Status Bottom Nav ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "56px",
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
          display: "flex",
          zIndex: 50,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveWatchmanTab("duty")}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: activeWatchmanTab === "duty" ? "#22C55E" : "#6B7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: activeWatchmanTab === "duty" ? 600 : 400,
            gap: "2px",
          }}
          data-ocid="watchman.nav.duty_tab"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Duty</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveWatchmanTab("status")}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: activeWatchmanTab === "status" ? "#22C55E" : "#6B7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: activeWatchmanTab === "status" ? 600 : 400,
            gap: "2px",
          }}
          data-ocid="watchman.nav.status_tab"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Status</span>
        </button>
      </div>

      {/* ── Visitor Bottom Sheet ── */}
      <BottomSheet
        open={section === "visitor"}
        onClose={() => {
          setSection("main");
          setVisitorType(null);
          setVisitorFlat(null);
        }}
        title="Log Entry"
      >
        <div className="flex flex-col gap-5" data-ocid="watchman.visitor_form">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {["Type", "Flat", "Confirm"].map((s, idx) => {
              const step = !visitorType ? 0 : !visitorFlat ? 1 : 2;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: idx <= step ? "#22C55E" : "#F3F4F6",
                      color: idx <= step ? "#FFFFFF" : "#9CA3AF",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: idx <= step ? "#16A34A" : "#9CA3AF" }}
                  >
                    {s}
                  </span>
                  {idx < 2 && (
                    <div
                      className="h-px flex-1 min-w-[16px]"
                      style={{
                        backgroundColor: idx < step ? "#22C55E" : "#E5E7EB",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Type selection */}
          <div>
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "#374151" }}
            >
              Step 1 — Who is at the gate?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  "guest",
                  "service",
                  "delivery",
                  "unknown",
                ] as VisitorTypeLocal[]
              ).map((t) => (
                <ChoiceBtn
                  key={t}
                  label={t === "unknown" ? "OTHER" : t.toUpperCase()}
                  selected={visitorType === t}
                  onTap={() => setVisitorType(t)}
                  color="#22C55E"
                  ocid={`watchman.visitor_type.${t}`}
                />
              ))}
            </div>
          </div>
          <div>
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "#6B7280" }}
            >
              Which flat?
            </p>
            {flats.length === 0 ? (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                Loading flats…
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {flats.map((f) => (
                  <ChoiceBtn
                    key={f.flatId}
                    label={f.flatNumber}
                    selected={visitorFlat?.flatId === f.flatId}
                    onTap={() => setVisitorFlat(f)}
                    color="#3B82F6"
                    ocid={`watchman.visitor_flat.${f.flatNumber}`}
                  />
                ))}
              </div>
            )}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={handleLogVisitor}
            disabled={!visitorType || !visitorFlat}
            className="w-full rounded-2xl font-bold text-xl flex items-center justify-center gap-3"
            style={{
              minHeight: "72px",
              backgroundColor:
                visitorType && visitorFlat ? "#F0FDF4" : "#F9FAFB",
              border: `2px solid ${visitorType && visitorFlat ? "#22C55E" : "#E5E7EB"}`,
              color: visitorType && visitorFlat ? "#16A34A" : "#9CA3AF",
            }}
            data-ocid="watchman.visitor.confirm_button"
          >
            <CheckCircle2 size={24} /> CONFIRM ENTRY
          </motion.button>
        </div>
      </BottomSheet>

      {/* ── Delivery Bottom Sheet ── */}
      <BottomSheet
        open={section === "delivery"}
        onClose={() => setSection("main")}
        title="Log Delivery"
      >
        <div className="flex flex-col gap-5" data-ocid="watchman.delivery_form">
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
            }}
          >
            <Package size={36} style={{ color: "#3B82F6" }} />
            <div>
              <p className="text-lg font-bold" style={{ color: "#111827" }}>
                Delivery
              </p>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Select destination flat
              </p>
            </div>
          </div>
          <div>
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "#6B7280" }}
            >
              Which flat?
            </p>
            {flats.length === 0 ? (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                Loading flats…
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
                {flats.map((f) => (
                  <ChoiceBtn
                    key={f.flatId}
                    label={f.flatNumber}
                    selected={deliveryFlat?.flatId === f.flatId}
                    onTap={() => setDeliveryFlat(f)}
                    color="#3B82F6"
                    ocid={`watchman.delivery_flat.${f.flatNumber}`}
                  />
                ))}
              </div>
            )}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={handleLogDelivery}
            disabled={!deliveryFlat}
            className="w-full rounded-2xl font-bold text-xl flex items-center justify-center gap-3"
            style={{
              minHeight: "72px",
              backgroundColor: deliveryFlat ? "#EFF6FF" : "#F9FAFB",
              border: `2px solid ${deliveryFlat ? "#3B82F6" : "#E5E7EB"}`,
              color: deliveryFlat ? "#1D4ED8" : "#9CA3AF",
            }}
            data-ocid="watchman.delivery.confirm_button"
          >
            <CheckCircle2 size={24} /> CONFIRM DELIVERY
          </motion.button>
        </div>
      </BottomSheet>

      {/* ── Handover Bottom Sheet ── */}
      <BottomSheet
        open={section === "handover"}
        onClose={() => setSection("main")}
        title="Shift Handover"
      >
        <div className="flex flex-col gap-5" data-ocid="watchman.handover_form">
          <p className="text-base" style={{ color: "#6B7280" }}>
            Confirm before ending shift:
          </p>

          {/* Gate locked */}
          <div>
            <p
              className="text-base font-semibold mb-3"
              style={{ color: "#111827" }}
            >
              Gate locked?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ChoiceBtn
                label="YES"
                selected={handover.gateLocked === true}
                onTap={() => setHandover((h) => ({ ...h, gateLocked: true }))}
                color="#22C55E"
                ocid="watchman.handover.gate_yes"
              />
              <ChoiceBtn
                label="NO"
                selected={handover.gateLocked === false}
                onTap={() => setHandover((h) => ({ ...h, gateLocked: false }))}
                color="#EF4444"
                ocid="watchman.handover.gate_no"
              />
            </div>
          </div>

          {/* Water motor */}
          <div>
            <p
              className="text-base font-semibold mb-3"
              style={{ color: "#111827" }}
            >
              Water motor off?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ChoiceBtn
                label="YES"
                selected={handover.motorOff === true}
                onTap={() => setHandover((h) => ({ ...h, motorOff: true }))}
                color="#22C55E"
                ocid="watchman.handover.motor_yes"
              />
              <ChoiceBtn
                label="NO"
                selected={handover.motorOff === false}
                onTap={() => setHandover((h) => ({ ...h, motorOff: false }))}
                color="#EF4444"
                ocid="watchman.handover.motor_no"
              />
            </div>
          </div>

          {/* Lift OK */}
          <div>
            <p
              className="text-base font-semibold mb-3"
              style={{ color: "#111827" }}
            >
              Lift working?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ChoiceBtn
                label="YES"
                selected={handover.liftOk === true}
                onTap={() => setHandover((h) => ({ ...h, liftOk: true }))}
                color="#22C55E"
                ocid="watchman.handover.lift_yes"
              />
              <ChoiceBtn
                label="NO"
                selected={handover.liftOk === false}
                onTap={() => setHandover((h) => ({ ...h, liftOk: false }))}
                color="#EF4444"
                ocid="watchman.handover.lift_no"
              />
            </div>
          </div>

          {/* Handover note */}
          <div>
            <p
              className="text-base font-semibold mb-3"
              style={{ color: "#111827" }}
            >
              Leave a note?{" "}
              <span
                className="font-normal text-sm"
                style={{ color: "#9CA3AF" }}
              >
                (Optional)
              </span>
            </p>
            <div className="flex flex-col gap-2">
              {HANDOVER_NOTES.map((n) => (
                <ChoiceBtn
                  key={n}
                  label={n}
                  selected={handover.note === n}
                  onTap={() =>
                    setHandover((h) => ({ ...h, note: h.note === n ? "" : n }))
                  }
                  color="#F59E0B"
                  ocid={`watchman.handover.note.${n.toLowerCase().replace(/ /g, "_")}`}
                />
              ))}
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={handleEndShift}
            disabled={!canEndShift}
            className="w-full rounded-2xl font-bold text-xl flex items-center justify-center gap-3"
            style={{
              minHeight: "72px",
              backgroundColor: canEndShift ? "#FEF2F2" : "#F9FAFB",
              border: `2px solid ${canEndShift ? "#EF4444" : "#E5E7EB"}`,
              color: canEndShift ? "#B91C1C" : "#9CA3AF",
            }}
            data-ocid="watchman.handover.submit_button"
          >
            <StopCircle size={24} /> END SHIFT
          </motion.button>
          {!canEndShift && (
            <p className="text-center text-sm" style={{ color: "#9CA3AF" }}>
              Confirm gate and water motor first
            </p>
          )}
        </div>
      </BottomSheet>

      {/* ── SOS Bottom Sheet ── */}
      <BottomSheet
        open={section === "sos"}
        onClose={() => {
          setSection("main");
          setSosConfirmed(false);
          setSosType(null);
        }}
        title="Emergency SOS"
      >
        <div className="flex flex-col gap-6 pb-4" data-ocid="watchman.sos_form">
          {!sosConfirmed ? (
            <>
              {/* Step 1: Select type */}
              <div>
                <p
                  className="text-base font-semibold mb-3"
                  style={{ color: "#111827" }}
                >
                  Select emergency type:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["medical", "fire", "safety", "other"] as const).map(
                    (t) => (
                      <ChoiceBtn
                        key={t}
                        label={t.toUpperCase()}
                        selected={sosType === t}
                        onTap={() => setSosType(t)}
                        color="#EF4444"
                        ocid={`watchman.sos_type.${t}`}
                      />
                    ),
                  )}
                </div>
              </div>
              {/* Step 2: Hold to confirm */}
              {sosType !== null ? (
                <SOSHoldButton onTriggered={handleSOSConfirm} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <p
                    className="text-base text-center"
                    style={{ color: "#9CA3AF" }}
                  >
                    Select an emergency type above to activate the SOS button
                  </p>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 py-4"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center sos-pulse"
                style={{
                  backgroundColor: "#EF4444",
                  border: "3px solid #B91C1C",
                }}
              >
                <AlertTriangle size={48} style={{ color: "#FFFFFF" }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "#B91C1C" }}>
                SOS SENT
              </h2>
              <p className="text-base text-center" style={{ color: "#6B7280" }}>
                All residents and the Super Admin have been notified. Stay calm
                and assist.
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSosConfirmed(false);
                  setSosType(null);
                  setSection("main");
                }}
                className="w-full rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
                style={{
                  minHeight: "64px",
                  backgroundColor: "#F9FAFB",
                  border: "2px solid #E5E7EB",
                  color: "#374151",
                }}
                data-ocid="watchman.sos.close_button"
              >
                Close
              </motion.button>
            </motion.div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
