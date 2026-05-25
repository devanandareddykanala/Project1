import { ArrowUp, Brush, DoorOpen, Droplets } from "lucide-react";
import { motion } from "motion/react";

type GateState = "open" | "closed" | "locked";
type LiftState = "ok" | "issue" | "offline";

export interface WidgetStatus {
  gate: GateState;
  water: boolean;
  lift: LiftState;
  cleaning: boolean;
  lastUpdatedAt: number;
  lastUpdatedBy: string;
}

interface Props {
  status: WidgetStatus;
  canTap?: boolean;
  onToggleGate?: () => void;
  onToggleWater?: () => void;
  onToggleLift?: () => void;
  onToggleCleaning?: () => void;
}

function minsAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  return `${diff} mins ago`;
}

interface TileProps {
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  active: boolean;
  onTap?: () => void;
  canTap: boolean;
  ocid: string;
}

function StatusTile({
  icon: Icon,
  label,
  value,
  active,
  onTap,
  canTap,
  ocid,
}: TileProps) {
  return (
    <motion.button
      type="button"
      whileTap={canTap ? { scale: 0.93 } : {}}
      onClick={canTap ? onTap : undefined}
      data-ocid={ocid}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 min-h-[100px] w-full transition-all"
      style={{
        backgroundColor: active ? "#F0FDF4" : "#F9FAFB",
        border: `2px solid ${active ? "#86EFAC" : "#E5E7EB"}`,
        cursor: canTap ? "pointer" : "default",
        boxShadow: active ? "0 0 10px rgba(34,197,94,0.12)" : "none",
      }}
    >
      <Icon size={28} style={{ color: active ? "#16A34A" : "#9CA3AF" }} />
      <span
        className="text-base font-bold font-mono tracking-wide"
        style={{ color: active ? "#15803D" : "#6B7280" }}
      >
        {value}
      </span>
      <span
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: "#9CA3AF" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function WatchmanStatusWidget({
  status,
  canTap = false,
  onToggleGate,
  onToggleWater,
  onToggleLift,
  onToggleCleaning,
}: Props) {
  const gateValue =
    status.gate === "open"
      ? "OPEN"
      : status.gate === "closed"
        ? "CLOSED"
        : "LOCKED";
  const gateActive = status.gate === "open";
  const liftValue =
    status.lift === "ok" ? "OK" : status.lift === "issue" ? "ISSUE" : "OFFLINE";
  const liftActive = status.lift === "ok";

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #DCFCE7" }}
      data-ocid="watchman.status_board"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs font-mono font-bold tracking-[0.2em] uppercase"
          style={{ color: "#16A34A" }}
        >
          FACILITY STATUS
        </p>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          {minsAgo(status.lastUpdatedAt)}
        </p>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatusTile
          icon={DoorOpen}
          label="Gate"
          value={gateValue}
          active={gateActive}
          onTap={onToggleGate}
          canTap={canTap}
          ocid="watchman.status.gate"
        />
        <StatusTile
          icon={Droplets}
          label="Water Motor"
          value={status.water ? "ON" : "OFF"}
          active={status.water}
          onTap={onToggleWater}
          canTap={canTap}
          ocid="watchman.status.water"
        />
        <StatusTile
          icon={ArrowUp}
          label="Lift"
          value={liftValue}
          active={liftActive}
          onTap={onToggleLift}
          canTap={canTap}
          ocid="watchman.status.lift"
        />
        <StatusTile
          icon={Brush}
          label="Cleaning"
          value={status.cleaning ? "DONE" : "PENDING"}
          active={status.cleaning}
          onTap={onToggleCleaning}
          canTap={canTap}
          ocid="watchman.status.cleaning"
        />
      </div>

      {/* Footer */}
      <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
        by {status.lastUpdatedBy}
        {canTap ? "" : " · Start duty to update"}
      </p>
    </div>
  );
}
