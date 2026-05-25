import { createActor } from "@/backend";
import type { SupportTicket, TicketCategory, TicketStatus } from "@/backend";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  Building2,
  Clock,
  MessageSquare,
  Search,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StatusFilter = TicketStatus | "All";
type CategoryFilter = TicketCategory | "All";

/** Display ticket — adds apartmentName (derived from apartmentId) */
interface DisplayTicket extends SupportTicket {
  apartmentName: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  Open: {
    label: "Open",
    bg: "#FEF3C7",
    color: "#92400E",
  },
  InProgress: {
    label: "In Progress",
    bg: "#DBEAFE",
    color: "#1E40AF",
  },
  Resolved: {
    label: "Resolved",
    bg: "#DCFCE7",
    color: "#166534",
  },
  Closed: {
    label: "Closed",
    bg: "#F3F4F6",
    color: "#6B7280",
  },
};

const CATEGORY_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  Bug: {
    label: "Bug",
    bg: "#FEE2E2",
    color: "#991B1B",
  },
  Account: {
    label: "Account",
    bg: "#EDE9FE",
    color: "#5B21B6",
  },
  Payment: {
    label: "Payment",
    bg: "#CFFAFE",
    color: "#164E63",
  },
  Feature: {
    label: "Feature",
    bg: "#DCFCE7",
    color: "#166534",
  },
  Other: {
    label: "Other",
    bg: "#F3F4F6",
    color: "#374151",
  },
};

function getStatusKey(status: TicketStatus): string {
  if (typeof status === "string") return status as string;
  return (status as { __kind__: string }).__kind__ ?? "Open";
}

function getCategoryKey(category: TicketCategory): string {
  if (typeof category === "string") return category as string;
  return (category as { __kind__: string }).__kind__ ?? "Other";
}

function formatRelativeTime(ms: number) {
  const diff = Date.now() - ms;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SupportTickets() {
  const user = useAuthStore((s) => s.user);
  const { actor, isFetching } = useActor(createActor);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [selectedTicket, setSelectedTicket] = useState<DisplayTicket | null>(
    null,
  );
  const [tickets, setTickets] = useState<DisplayTicket[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getTickets()
      .then((raw) => {
        const mapped: DisplayTicket[] = raw.map((t) => ({
          ...t,
          apartmentName: t.apartmentId ? `Apt #${t.apartmentId}` : "—",
        }));
        setTickets(mapped);
      })
      .catch(() => {});
  }, [actor, isFetching]);

  const canUpdateStatus =
    user?.role === "founder" ||
    user?.role === "co_founder" ||
    user?.role === "employee";

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const sk = getStatusKey(t.status);
      const ck = getCategoryKey(t.category);
      const matchSearch =
        search === "" || t.subject.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "All" || sk === (statusFilter as string);
      const matchCat =
        categoryFilter === "All" || ck === (categoryFilter as string);
      return matchSearch && matchStatus && matchCat;
    });
  }, [tickets, search, statusFilter, categoryFilter]);

  const openCount = tickets.filter(
    (t) => getStatusKey(t.status) === "Open",
  ).length;

  const handleStatusUpdate = async (
    ticketId: bigint,
    newStatus: TicketStatus,
  ) => {
    if (!actor || updating) return;
    setUpdating(true);
    try {
      await actor.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: newStatus,
                updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
              }
            : t,
        ),
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
    } catch {
      // status update failed silently
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Layout>
      <div
        className="flex flex-col gap-4 p-4 pb-6"
        data-ocid="founder_tickets.page"
      >
        {/* Header */}
        <div className="pt-2">
          <p className="text-xs uppercase tracking-widest font-body mb-1 text-[#22C55E]">
            Founder Portal
          </p>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Support Tickets
            </h1>
            {openCount > 0 && (
              <Badge
                className="text-xs px-2 py-0.5 rounded-full font-body"
                style={{
                  backgroundColor: "#FEF3C7",
                  color: "#92400E",
                  border: "1px solid #FDE68A",
                }}
                data-ocid="founder_tickets.open_count_badge"
              >
                {openCount} open
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="pl-9 h-10 rounded-xl border font-body text-sm bg-white border-gray-200 text-gray-900"
            data-ocid="founder_tickets.search_input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X size={12} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["All", "Open", "InProgress", "Resolved"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s as StatusFilter)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full font-body border transition-colors"
              style={{
                backgroundColor: statusFilter === s ? "#DCFCE7" : "#FFFFFF",
                borderColor: statusFilter === s ? "#22C55E" : "#E5E7EB",
                color: statusFilter === s ? "#166534" : "#6B7280",
              }}
              data-ocid={`founder_tickets.filter_status.${s.toLowerCase()}`}
            >
              {s === "All" ? "All" : (STATUS_CONFIG[s]?.label ?? s)}
            </button>
          ))}
          <div className="w-px shrink-0 bg-gray-200" />
          {(["All", "Bug", "Account", "Payment", "Feature"] as const).map(
            (c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c as CategoryFilter)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full font-body border transition-colors"
                style={{
                  backgroundColor: categoryFilter === c ? "#EDE9FE" : "#FFFFFF",
                  borderColor: categoryFilter === c ? "#8B5CF6" : "#E5E7EB",
                  color: categoryFilter === c ? "#5B21B6" : "#6B7280",
                }}
                data-ocid={`founder_tickets.filter_category.${c.toLowerCase()}`}
              >
                {c === "All" ? "All Types" : (CATEGORY_CONFIG[c]?.label ?? c)}
              </button>
            ),
          )}
        </div>

        {/* Ticket list */}
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3 bg-gray-50 border border-gray-200"
            data-ocid="founder_tickets.empty_state"
          >
            <MessageSquare size={36} className="text-gray-300" />
            <p className="text-sm text-center font-body text-gray-500">
              {search || statusFilter !== "All" || categoryFilter !== "All"
                ? "No tickets match your filters"
                : "No support tickets yet"}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setCategoryFilter("All");
              }}
              className="text-xs font-body text-[#22C55E]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((ticket, idx) => {
              const sk = getStatusKey(ticket.status);
              const ck = getCategoryKey(ticket.category);
              const sc = STATUS_CONFIG[sk] ?? STATUS_CONFIG.Open;
              const cc = CATEGORY_CONFIG[ck] ?? CATEGORY_CONFIG.Other;
              return (
                <button
                  key={String(ticket.id)}
                  type="button"
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left rounded-2xl p-4 border border-gray-200 bg-white hover:border-[#22C55E] transition-colors"
                  data-ocid={`founder_tickets.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold font-body leading-snug line-clamp-2 flex-1 text-left text-gray-900">
                      {ticket.subject}
                    </p>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs border-0 px-2 py-0.5 font-body"
                      style={{ backgroundColor: sc.bg, color: sc.color }}
                    >
                      {sc.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Building2 size={11} className="text-gray-400" />
                      <span className="text-xs font-body text-gray-500">
                        {ticket.apartmentName}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs border-0 px-2 py-0 font-body"
                      style={{ backgroundColor: cc.bg, color: cc.color }}
                    >
                      {cc.label}
                    </Badge>
                    <span className="text-xs font-body ml-auto text-gray-400">
                      {formatRelativeTime(Number(ticket.createdAt) / 1_000_000)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Privacy note */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50">
          <Shield size={12} className="text-[#22C55E]" />
          <p className="text-xs font-body text-green-700">
            Apartment name only — no resident personal data visible
          </p>
        </div>
      </div>

      {/* Ticket detail modal */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      >
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl border border-gray-200 p-0 overflow-hidden bg-white"
          data-ocid="founder_tickets.dialog"
        >
          <DialogHeader className="px-5 pt-5 pb-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 bg-green-50">
                <MessageSquare size={14} className="text-[#22C55E]" />
              </div>
              <DialogTitle className="text-sm font-semibold font-body leading-snug text-gray-900">
                {selectedTicket?.subject}
              </DialogTitle>
            </div>
          </DialogHeader>

          {selectedTicket && (
            <div className="px-5 pb-5 flex flex-col gap-4 mt-4">
              {/* Meta row */}
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const sk = getStatusKey(selectedTicket.status);
                  const ck = getCategoryKey(selectedTicket.category);
                  const sc = STATUS_CONFIG[sk] ?? STATUS_CONFIG.Open;
                  const cc = CATEGORY_CONFIG[ck] ?? CATEGORY_CONFIG.Other;
                  return (
                    <>
                      <Badge
                        className="text-xs border-0 px-2.5 py-1 font-body"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {sc.label}
                      </Badge>
                      <Badge
                        className="text-xs border-0 px-2.5 py-1 font-body"
                        style={{ backgroundColor: cc.bg, color: cc.color }}
                      >
                        {cc.label}
                      </Badge>
                    </>
                  );
                })()}
              </div>

              {/* Description */}
              <div className="rounded-xl p-3 bg-gray-50">
                <p className="text-sm font-body leading-relaxed text-gray-700">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 size={11} className="text-gray-400" />
                    <span className="text-xs font-body text-gray-500">
                      Apartment
                    </span>
                  </div>
                  <p className="text-xs font-semibold font-body text-gray-900">
                    {selectedTicket.apartmentName}
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={11} className="text-gray-400" />
                    <span className="text-xs font-body text-gray-500">
                      Created
                    </span>
                  </div>
                  <p className="text-xs font-semibold font-body text-gray-900">
                    {formatRelativeTime(
                      Number(selectedTicket.createdAt) / 1_000_000,
                    )}
                  </p>
                </div>
                {selectedTicket.assignedTo && (
                  <div className="rounded-xl p-3 bg-gray-50 col-span-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <UserRound size={11} className="text-gray-400" />
                      <span className="text-xs font-body text-gray-500">
                        Assigned To
                      </span>
                    </div>
                    <p className="text-xs font-semibold font-body text-gray-900">
                      {selectedTicket.assignedTo}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {canUpdateStatus && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold font-body text-gray-500">
                    Update Status
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Open", "InProgress", "Resolved"] as const).map((s) => {
                      const curKey = getStatusKey(selectedTicket.status);
                      const cfg = STATUS_CONFIG[s];
                      const isActive = curKey === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            handleStatusUpdate(
                              selectedTicket.id,
                              s as unknown as TicketStatus,
                            )
                          }
                          className="text-xs py-2 px-2 rounded-xl font-body border transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: isActive ? cfg.bg : "#F9FAFB",
                            borderColor: isActive ? cfg.color : "#E5E7EB",
                            color: isActive ? cfg.color : "#6B7280",
                          }}
                          data-ocid={`founder_tickets.set_status_${s.toLowerCase()}_button`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Close */}
              <Button
                variant="outline"
                className="h-10 rounded-xl font-body text-sm bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setSelectedTicket(null)}
                data-ocid="founder_tickets.close_button"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
