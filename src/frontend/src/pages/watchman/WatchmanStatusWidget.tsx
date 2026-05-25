import type { FacilityStatus as BackendFacilityStatus } from "@/backend";
import { GateStatus, LiftStatus, WaterMotorStatus } from "@/backend";
import { Brush, DoorOpen, Droplets, Eye, Shield } from "lucide-react";

interface WatchmanStatusWidgetProps {
  facilityStatus?: BackendFacilityStatus | null;
  currentWatchman?: string;
  shiftStartTime?: number | null;
  todayVisitorCount?: number;
  lastVisitorFlat?: string | null;
  lastVisitorTime?: number | null;
}

function fmtRelative(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

function StatusTile({
  label,
  value,
  isActive,
  isWarning = false,
  lastUpdated,
  icon: Icon,
  ocid,
}: {
  label: string;
  value: string;
  isActive: boolean;
  isWarning?: boolean;
  lastUpdated?: string;
  icon: React.FC<{ size?: number; color?: string }>;
  ocid: string;
}) {
  const bg = "#FFFFFF";
  const border = isWarning
    ? "1px solid #FCA5A5"
    : isActive
      ? "1px solid #22C55E"
      : "1px solid #E5E7EB";
  const iconColor = isWarning ? "#EF4444" : isActive ? "#22C55E" : "#9CA3AF";
  const textColor = isWarning ? "#B91C1C" : isActive ? "#16A34A" : "#6B7280";
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{
        backgroundColor: bg,
        border,
        borderLeft: isActive
          ? "4px solid #22C55E"
          : isWarning
            ? "4px solid #EF4444"
            : "1px solid #E5E7EB",
      }}
      data-ocid={ocid}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: "#F9FAFB",
        }}
      >
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
          {label}
        </p>
        <p className="text-base font-bold" style={{ color: textColor }}>
          {value}
        </p>
      </div>
      {lastUpdated && (
        <p className="text-xs" style={{ color: "#D1D5DB" }}>
          {lastUpdated}
        </p>
      )}
    </div>
  );
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WatchmanStatusWidget({
  facilityStatus,
  currentWatchman,
  shiftStartTime,
  todayVisitorCount = 0,
  lastVisitorFlat,
  lastVisitorTime,
}: WatchmanStatusWidgetProps) {
  const gateOpen = facilityStatus
    ? facilityStatus.gateStatus === GateStatus.Open
    : true;
  const waterOn = facilityStatus
    ? facilityStatus.waterMotorStatus === WaterMotorStatus.On
    : false;
  const liftOk = facilityStatus
    ? facilityStatus.liftStatus === LiftStatus.OK
    : true;
  const cleaningDone = facilityStatus
    ? (facilityStatus.cleaningStatus as unknown as string) === "Done"
    : false;
  const lastUpdated = facilityStatus
    ? fmtRelative(Number(facilityStatus.lastUpdatedAt) / 1_000_000)
    : "No data";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", border: "1.5px solid #D1FAE5" }}
      data-ocid="watchman_status_widget"
    >
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: "#F0FDF4",
          borderBottom: "1px solid #D1FAE5",
        }}
      >
        <div className="flex items-center gap-2">
          <Eye size={16} style={{ color: "#22C55E" }} />
          <span className="text-sm font-bold" style={{ color: "#111827" }}>
            Status Board
          </span>
        </div>
        <span className="text-xs" style={{ color: "#9CA3AF" }}>
          Updated {lastUpdated}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
          data-ocid="watchman_status_widget.duty_info"
        >
          <div>
            <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
              On Duty
            </p>
            <p className="text-sm font-bold" style={{ color: "#111827" }}>
              {currentWatchman ?? "No watchman active"}
            </p>
          </div>
          {shiftStartTime && (
            <div className="text-right">
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Since
              </p>
              <p className="text-xs font-semibold" style={{ color: "#22C55E" }}>
                {fmtTime(shiftStartTime)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatusTile
            label="Gate"
            value={gateOpen ? "Open" : "Closed"}
            isActive={gateOpen}
            icon={DoorOpen}
            lastUpdated={lastUpdated}
            ocid="watchman_status_widget.gate"
          />
          <StatusTile
            label="Water Motor"
            value={waterOn ? "ON" : "OFF"}
            isActive={waterOn}
            icon={Droplets}
            lastUpdated={lastUpdated}
            ocid="watchman_status_widget.water"
          />
          <StatusTile
            label="Lift"
            value={liftOk ? "Working" : "Issue"}
            isActive={liftOk}
            isWarning={!liftOk}
            icon={({ size, color }) => <Shield size={size} color={color} />}
            lastUpdated={lastUpdated}
            ocid="watchman_status_widget.lift"
          />
          <StatusTile
            label="Cleaning"
            value={cleaningDone ? "Done" : "Pending"}
            isActive={cleaningDone}
            icon={Brush}
            lastUpdated={lastUpdated}
            ocid="watchman_status_widget.cleaning"
          />
        </div>

        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
          data-ocid="watchman_status_widget.visitor_summary"
        >
          <div>
            <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
              Today's Visitors
            </p>
            <p className="text-2xl font-black" style={{ color: "#111827" }}>
              {todayVisitorCount}
            </p>
          </div>
          {lastVisitorFlat && lastVisitorTime && (
            <div className="text-right">
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Last entry
              </p>
              <p className="text-xs font-semibold" style={{ color: "#374151" }}>
                Flat {lastVisitorFlat}
              </p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                {fmtTime(lastVisitorTime)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
