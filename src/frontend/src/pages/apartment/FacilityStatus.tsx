import { createActor } from "@/backend";
import type { FacilityStatus as BackendFacilityStatus } from "@/backend";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  ArrowUp,
  DoorClosed,
  DoorOpen,
  Droplets,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

interface FacilityDisplayState {
  gate: string;
  motor: string;
  lift: string;
  cleaning: string;
  updatedBy: string;
  updatedAt: Date | null;
}

function enumKey(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "__kind__" in val)
    return (val as { __kind__: string }).__kind__;
  return "";
}

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapFacility(raw: BackendFacilityStatus): FacilityDisplayState {
  return {
    gate: enumKey(raw.gateStatus),
    motor: enumKey(raw.waterMotorStatus),
    lift: enumKey(raw.liftStatus),
    cleaning: enumKey(raw.cleaningStatus),
    updatedBy: String(raw.lastUpdatedBy),
    updatedAt: new Date(Number(raw.lastUpdatedAt) / 1_000_000),
  };
}

function gateColorClass(s: string) {
  if (s === "Open") return "status-ok";
  if (s === "Closed") return "status-caution";
  return "status-issue";
}
function motorColorClass(s: string) {
  return s === "On" ? "bg-primary" : "bg-muted";
}
function liftColorClass(s: string) {
  if (s === "OK") return "status-ok";
  if (s === "Issue") return "status-issue";
  return "bg-muted";
}
function cleaningColorClass(s: string) {
  return s === "Done" ? "status-ok" : "status-caution";
}

export function FacilityStatus() {
  const { user } = useAuthStore();
  const { actor, isFetching } = useActor(createActor);
  const [facility, setFacility] = useState<FacilityDisplayState | null>(null);

  useEffect(() => {
    if (!actor || isFetching || !user?.apartmentId) return;
    const fetchStatus = () => {
      actor
        .getFacilityStatus(BigInt(user.apartmentId!))
        .then((raw) => {
          if (raw) setFacility(mapFacility(raw));
        })
        .catch(() => {});
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 30_000);
    return () => clearInterval(timer);
  }, [actor, isFetching, user?.apartmentId]);

  const tiles = facility
    ? [
        {
          id: "gate",
          label: "Gate",
          status: facility.gate,
          displayStatus: facility.gate,
          colorClass: gateColorClass(facility.gate),
          active: facility.gate === "Open",
          Icon: facility.gate === "Open" ? DoorOpen : DoorClosed,
        },
        {
          id: "motor",
          label: "Water Motor",
          status: facility.motor,
          displayStatus: facility.motor,
          colorClass: motorColorClass(facility.motor),
          active: facility.motor === "On",
          Icon: Droplets,
        },
        {
          id: "lift",
          label: "Lift",
          status: facility.lift,
          displayStatus: facility.lift,
          colorClass: liftColorClass(facility.lift),
          active: facility.lift === "OK",
          Icon: ArrowUp,
        },
        {
          id: "cleaning",
          label: "Cleaning",
          status: facility.cleaning,
          displayStatus: facility.cleaning,
          colorClass: cleaningColorClass(facility.cleaning),
          active: facility.cleaning === "Done",
          Icon: Sparkles,
        },
      ]
    : [];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b shadow-subtle sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4">
            <h1 className="font-display text-xl font-bold text-foreground">
              Apartment Status
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {facility?.updatedAt
                ? `Last updated ${timeAgo(facility.updatedAt)} · by user ${facility.updatedBy}`
                : "No updates yet"}
            </p>
          </div>
        </div>

        {/* Status grid */}
        <div className="max-w-lg mx-auto p-4">
          {facility === null ? (
            <div
              className="flex flex-col items-center gap-3 py-16"
              data-ocid="facility.empty_state"
            >
              <Droplets
                className="h-10 w-10 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="text-sm text-muted-foreground text-center">
                No status reported yet.
                <br />
                Watchman will update from their dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {tiles.map((tile, idx) => (
                <Card
                  key={tile.id}
                  data-ocid={`facility.status_tile.${idx + 1}`}
                  className="overflow-hidden border-border"
                >
                  <div className={`${tile.colorClass} h-2 w-full`} />
                  <div className="p-5 flex flex-col items-center text-center gap-3">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        tile.active ? "bg-primary/20" : "bg-muted"
                      }`}
                    >
                      <tile.Icon
                        className={`h-8 w-8 ${
                          tile.active ? "text-primary" : "text-muted-foreground"
                        }`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                        {tile.label}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-sm font-bold tracking-wide px-3 py-0.5 border-2"
                      >
                        {tile.displayStatus}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            Refreshes every 30 seconds
          </p>
        </div>
      </div>
    </Layout>
  );
}
