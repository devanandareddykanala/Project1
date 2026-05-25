import { createActor } from "@/backend";
import type { SOSAlert } from "@/backend";
import { AlertType } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { AlertTriangle, Clock, PhoneCall, Shield } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

const SOS_TYPES = [
  { label: "Medical Emergency", value: "Medical" },
  { label: "Fire", value: "Fire" },
  { label: "Security Threat", value: "Security" },
  { label: "Gas Leak", value: "Gas" },
  { label: "Other Emergency", value: "Other" },
];

const HOLD_DURATION_MS = 3000;
const TICK_MS = 50;

export function SOSModule() {
  const user = useAuthStore((s) => s.user);
  const { actor } = useActor(createActor);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sosType, setSosType] = useState("Medical");
  const [locationNote, setLocationNote] = useState("");
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [triggered, setTriggered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    if (!actor) return;
    try {
      setLoadingAlerts(true);
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const result = await actor.getSOSLog(aptId);
      setAlerts(result);
    } catch {
      // silent
    } finally {
      setLoadingAlerts(false);
    }
  }, [actor, user?.apartmentId]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Block all browser long-press / text-selection / Google search bar behaviour
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const prevent = (e: Event) => e.preventDefault();
    container.addEventListener("contextmenu", prevent, { passive: false });
    container.addEventListener("selectstart", prevent, { passive: false });
    container.addEventListener("touchstart", prevent, { passive: false });
    return () => {
      container.removeEventListener("contextmenu", prevent);
      container.removeEventListener("selectstart", prevent);
      container.removeEventListener("touchstart", prevent);
    };
  }, []);

  if (!actor)
    return (
      <Layout>
        <div className="min-h-screen bg-white p-4 text-center text-gray-400 flex items-center justify-center">
          Loading...
        </div>
      </Layout>
    );

  const triggerSOS = async () => {
    try {
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const flatId = user?.flatId ? BigInt(String(user.flatId)) : 0n;
      await actor.triggerSOS(flatId, aptId, AlertType.Other);
      setTriggered(true);
      toast.error("🚨 SOS Alert Sent — Help is on the way", { duration: 8000 });
      await loadAlerts();
    } catch {
      toast.error(
        "Failed to send SOS. Please call emergency services directly.",
      );
    }
  };

  const startHold = () => {
    if (triggered) return;
    setHolding(true);
    setProgress(0);
    const totalTicks = HOLD_DURATION_MS / TICK_MS;
    let tick = 0;
    timerRef.current = setInterval(() => {
      tick++;
      const pct = (tick / totalTicks) * 100;
      setProgress(pct);
      if (pct >= 100) {
        clearTimer();
        setHolding(false);
        setProgress(100);
        void triggerSOS();
      }
    }, TICK_MS);
  };

  const cancelHold = () => {
    clearTimer();
    setHolding(false);
    setProgress(0);
  };

  const circumference = 2 * Math.PI * 62;

  return (
    <Layout>
      <div
        ref={containerRef}
        className="p-4 bg-white min-h-screen"
        data-ocid="sos_module.page"
        style={
          {
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          } as React.CSSProperties
        }
      >
        <h1
          className="text-xl font-bold text-gray-900 mb-1"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "none",
          }}
        >
          SOS Emergency
        </h1>
        <p
          className="text-sm text-gray-500 mb-4"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "none",
          }}
        >
          Hold the button for 3 seconds to alert all residents
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 mb-4">
          <div className="mb-3">
            <label
              htmlFor="sos-type"
              className="text-xs font-medium text-gray-600 mb-1 block"
            >
              Emergency Type
            </label>
            <select
              id="sos-type"
              value={sosType}
              onChange={(e) => setSosType(e.target.value)}
              className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
              data-ocid="sos_module.select"
            >
              {SOS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="sos-location"
              className="text-xs font-medium text-gray-600 mb-1 block"
            >
              Location (optional)
            </label>
            <input
              id="sos-location"
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              placeholder="e.g. 3rd floor, Flat A-301"
              className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
              data-ocid="sos_module.input"
            />
          </div>
        </div>

        <div
          className="flex flex-col items-center py-6"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          <div className="relative mb-4">
            <svg
              role="presentation"
              aria-hidden="true"
              width="160"
              height="160"
              className="absolute inset-0"
              style={{
                transform: "rotate(-90deg)",
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <circle
                cx="80"
                cy="80"
                r="62"
                fill="none"
                stroke="#FEE2E2"
                strokeWidth="6"
              />
              <circle
                cx="80"
                cy="80"
                r="62"
                fill="none"
                stroke={holding ? "#EF4444" : "#22C55E"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - progress / 100)}`}
                style={{
                  transition: holding ? "none" : "stroke-dashoffset 0.3s ease",
                }}
              />
            </svg>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                startHold();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                cancelHold();
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                cancelHold();
              }}
              onPointerCancel={(e) => {
                e.preventDefault();
                cancelHold();
              }}
              onContextMenu={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              style={
                {
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  touchAction: "none",
                  WebkitTouchCallout: "none",
                  cursor: "pointer",
                } as React.CSSProperties
              }
              className={`w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center gap-1 font-bold text-white transition-transform active:scale-95 ${
                triggered
                  ? "bg-orange-400"
                  : holding
                    ? "bg-red-600 scale-95"
                    : "bg-red-500"
              }`}
              data-ocid="sos_module.button"
              aria-label="SOS Emergency Button — hold for 3 seconds"
            >
              <AlertTriangle size={36} style={{ pointerEvents: "none" }} />
              <span
                className="text-base font-black tracking-widest"
                style={{ pointerEvents: "none" }}
              >
                {triggered ? "SENT" : "SOS"}
              </span>
              {holding && (
                <span
                  className="text-xs opacity-80"
                  style={{ pointerEvents: "none" }}
                >
                  {Math.ceil(3 - (progress / 100) * 3)}s
                </span>
              )}
            </button>
          </div>
          <p
            className="text-xs text-gray-400 text-center max-w-xs"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              pointerEvents: "none",
            }}
          >
            {triggered
              ? "Alert sent. Help is on the way. Stay safe."
              : holding
                ? "Keep holding..."
                : "Press and hold for 3 seconds to trigger SOS"}
          </p>
        </div>

        {!loadingAlerts && alerts.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              Recent Alerts
            </p>
            <div className="flex flex-col gap-2">
              {alerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={String(alert.id)}
                  className={`rounded-xl border p-3 ${alert.resolvedAt != null ? "bg-gray-50 border-gray-200" : "bg-red-50 border-red-200"}`}
                  data-ocid={`sos_module.item.${idx + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={14}
                        className={
                          alert.resolvedAt != null
                            ? "text-gray-400"
                            : "text-red-500"
                        }
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {String(alert.alertType)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${alert.resolvedAt != null ? "text-gray-400" : "text-red-600"}`}
                    >
                      {alert.resolvedAt != null ? "Resolved" : "Active"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {alert.resolutionNote && (
                      <span className="text-xs text-gray-500 truncate">
                        {alert.resolutionNote}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(
                        Number(alert.triggeredAt) / 1_000_000,
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-red-50 rounded-xl border border-red-200 p-4 flex items-center gap-3">
          <PhoneCall size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p
              className="text-sm font-semibold text-red-700"
              style={{ userSelect: "none" }}
            >
              Emergency Contacts
            </p>
            <p
              className="text-xs text-red-500 mt-0.5"
              style={{ userSelect: "none" }}
            >
              Police: 100 · Fire: 101 · Ambulance: 108
            </p>
          </div>
        </div>
        <div className="mt-3 bg-[#F0FDF4] rounded-xl border border-[#DCFCE7] p-3 flex items-start gap-2">
          <Shield size={16} className="text-[#22C55E] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500" style={{ userSelect: "none" }}>
            SOS alerts are sent to all residents and the Super Admin
            immediately. Only use for genuine emergencies.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default SOSModule;
