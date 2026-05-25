import { TicketStatus, TicketType, createActor } from "@/backend";
import type { SupportTicket, TicketMessage } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  ChevronDown,
  ChevronUp,
  Send,
  StickyNote,
  TicketCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type FilterTab = "All" | "Open" | "InProgress" | "Resolved" | "Disputes";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Open", label: "Open" },
  { key: "InProgress", label: "In Progress" },
  { key: "Resolved", label: "Resolved" },
  { key: "Disputes", label: "Disputes" },
];

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ kind }: { kind: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    Open: { bg: "bg-orange-100", text: "text-orange-700", label: "Open" },
    InProgress: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "In Progress",
    },
    Resolved: { bg: "bg-green-100", text: "text-green-700", label: "Resolved" },
  };
  const s = map[kind] ?? map.Open;
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}

export function FounderTickets() {
  const { actor, isFetching } = useActor(createActor);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Map<string, TicketMessage[]>>(
    new Map(),
  );
  const [threadLoading, setThreadLoading] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<Map<string, string>>(new Map());
  const [noteText, setNoteText] = useState<Map<string, string>>(new Map());
  const [resolveNote, setResolveNote] = useState<Map<string, string>>(
    new Map(),
  );
  const [showResolve, setShowResolve] = useState<Set<string>>(new Set());
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getTickets()
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const filtered = tickets.filter((t) => {
    const matchFilter = (() => {
      if (filter === "All") return true;
      if (filter === "Disputes")
        return t.ticketType === TicketType.DisputeEscalation;
      return String(t.status) === filter;
    })();
    const matchSearch =
      search.trim() === "" ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const loadThread = async (ticket: SupportTicket) => {
    if (!actor) return;
    const idStr = String(ticket.id);
    if (threads.has(idStr)) {
      setExpandedId(expandedId === idStr ? null : idStr);
      return;
    }
    setExpandedId(expandedId === idStr ? null : idStr);
    setThreadLoading((prev) => new Set(prev).add(idStr));
    try {
      const result = await actor.getTicketThread(ticket.id);
      if (result.__kind__ === "ok") {
        setThreads((prev) => new Map(prev).set(idStr, result.ok));
      }
    } catch {
      /* silent */
    } finally {
      setThreadLoading((prev) => {
        const n = new Set(prev);
        n.delete(idStr);
        return n;
      });
    }
  };

  const sendReply = async (ticket: SupportTicket) => {
    if (!actor) return;
    const idStr = String(ticket.id);
    const msg = (replyText.get(idStr) ?? "").trim();
    if (!msg) return;
    setUpdating((prev) => new Set(prev).add(idStr));
    try {
      const result = await actor.addMessage(ticket.id, msg);
      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }
      setReplyText((prev) => new Map(prev).set(idStr, ""));
      // Refresh thread
      const updated = await actor.getTicketThread(ticket.id);
      if (updated.__kind__ === "ok")
        setThreads((prev) => new Map(prev).set(idStr, updated.ok));
      toast.success("Reply sent");
    } catch {
      toast.error("Failed to send reply.");
    } finally {
      setUpdating((prev) => {
        const n = new Set(prev);
        n.delete(idStr);
        return n;
      });
    }
  };

  const sendNote = async (ticket: SupportTicket) => {
    if (!actor) return;
    const idStr = String(ticket.id);
    const note = (noteText.get(idStr) ?? "").trim();
    if (!note) return;
    setUpdating((prev) => new Set(prev).add(`note-${idStr}`));
    try {
      const result = await actor.addInternalNote(ticket.id, note);
      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }
      setNoteText((prev) => new Map(prev).set(idStr, ""));
      const updated = await actor.getTicketThread(ticket.id);
      if (updated.__kind__ === "ok")
        setThreads((prev) => new Map(prev).set(idStr, updated.ok));
      toast.success("Internal note added");
    } catch {
      toast.error("Failed to add note.");
    } finally {
      setUpdating((prev) => {
        const n = new Set(prev);
        n.delete(`note-${idStr}`);
        return n;
      });
    }
  };

  const handleResolve = async (ticket: SupportTicket) => {
    if (!actor) return;
    const idStr = String(ticket.id);
    const note = (resolveNote.get(idStr) ?? "").trim();
    setUpdating((prev) => new Set(prev).add(`resolve-${idStr}`));
    try {
      const result = await actor.markResolved(ticket.id, note);
      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id ? { ...t, status: TicketStatus.Resolved } : t,
        ),
      );
      setShowResolve((prev) => {
        const n = new Set(prev);
        n.delete(idStr);
        return n;
      });
      toast.success("Ticket resolved");
    } catch {
      toast.error("Failed to resolve ticket.");
    } finally {
      setUpdating((prev) => {
        const n = new Set(prev);
        n.delete(`resolve-${idStr}`);
        return n;
      });
    }
  };

  const updateStatus = async (
    ticket: SupportTicket,
    _newKind: "InProgress",
  ) => {
    if (!actor) return;
    const idStr = String(ticket.id);
    setUpdating((prev) => new Set(prev).add(idStr));
    try {
      const result = await actor.updateTicketStatus(
        ticket.id,
        TicketStatus.InProgress,
      );
      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id ? { ...t, status: TicketStatus.InProgress } : t,
        ),
      );
      toast.success("Ticket marked In Progress");
    } catch {
      toast.error("Failed to update ticket.");
    } finally {
      setUpdating((prev) => {
        const n = new Set(prev);
        n.delete(idStr);
        return n;
      });
    }
  };

  return (
    <Layout>
      <div
        className="flex flex-col gap-4 px-4 py-5 bg-white min-h-screen"
        data-ocid="founder_tickets.page"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} total</p>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search tickets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[#DCFCE7] rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          data-ocid="founder_tickets.search_input"
        />

        {/* Filter tabs */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          data-ocid="founder_tickets.filter_tabs"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === tab.key
                  ? tab.key === "Disputes"
                    ? "bg-purple-600 text-white"
                    : "bg-[#22C55E] text-white"
                  : tab.key === "Disputes"
                    ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              data-ocid={`founder_tickets.filter.${tab.key.toLowerCase()}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16"
            data-ocid="founder_tickets.empty_state"
          >
            <div className="bg-[#F0FDF4] rounded-full p-5">
              <TicketCheck size={32} className="text-[#22C55E]" />
            </div>
            <p className="text-gray-600 font-medium">No tickets found</p>
            <p className="text-sm text-gray-400">
              No {filter === "All" ? "" : `${filter.toLowerCase()} `}tickets at
              this time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((t, i) => {
              const idStr = String(t.id);
              const isExpanded = expandedId === idStr;
              const isUpdating = updating.has(idStr);
              const kind = String(t.status);
              const isDispute = t.ticketType === TicketType.DisputeEscalation;
              const thread = threads.get(idStr) ?? [];
              const isThreadLoading = threadLoading.has(idStr);
              const isNoteSending = updating.has(`note-${idStr}`);
              const isResolving = updating.has(`resolve-${idStr}`);
              const isResolveOpen = showResolve.has(idStr);
              return (
                <div
                  key={idStr}
                  className={`bg-white border rounded-2xl flex flex-col gap-0 overflow-hidden ${
                    isDispute
                      ? "border-l-4 border-l-purple-500 border-[#DCFCE7]"
                      : "border-[#DCFCE7]"
                  }`}
                  data-ocid={`founder_tickets.item.${i + 1}`}
                >
                  {/* Header row — click to expand */}
                  <button
                    type="button"
                    className="flex items-start justify-between gap-2 p-4 text-left w-full hover:bg-gray-50 transition-colors"
                    onClick={() => void loadThread(t)}
                    data-ocid={`founder_tickets.expand.${i + 1}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">
                          {t.subject}
                        </p>
                        {isDispute && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Dispute
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(t.createdAt)} · #{idStr}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge kind={kind} />
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="flex flex-col gap-3 px-4 pb-4 border-t border-[#DCFCE7]">
                      <p className="text-sm text-gray-600 mt-3">
                        {t.description}
                      </p>

                      {/* Thread */}
                      {isThreadLoading ? (
                        <div className="h-10 bg-gray-50 rounded-xl animate-pulse" />
                      ) : thread.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                          {thread.map((msg) => (
                            <div
                              key={String(msg.id)}
                              className={`rounded-xl px-3 py-2.5 text-sm ${
                                msg.isInternal
                                  ? "bg-amber-50 border border-amber-200 text-amber-900"
                                  : "bg-white border border-[#DCFCE7] text-gray-700"
                              }`}
                            >
                              {msg.isInternal && (
                                <p className="text-xs font-semibold text-amber-700 mb-1">
                                  Internal Note
                                </p>
                              )}
                              <p>{msg.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(msg.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">
                          No messages yet.
                        </p>
                      )}

                      {/* Reply box */}
                      <div className="flex flex-col gap-2">
                        <textarea
                          ref={replyRef}
                          rows={2}
                          placeholder="Reply to user…"
                          value={replyText.get(idStr) ?? ""}
                          onChange={(e) =>
                            setReplyText((prev) =>
                              new Map(prev).set(idStr, e.target.value),
                            )
                          }
                          className="w-full border border-[#DCFCE7] rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E] resize-none"
                          data-ocid={`founder_tickets.reply_input.${i + 1}`}
                        />
                        <button
                          type="button"
                          disabled={
                            isUpdating || !(replyText.get(idStr) ?? "").trim()
                          }
                          onClick={() => void sendReply(t)}
                          className="self-end flex items-center gap-1.5 px-4 py-1.5 bg-[#22C55E] text-white text-sm font-medium rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-50"
                          data-ocid={`founder_tickets.send_reply.${i + 1}`}
                        >
                          <Send size={13} />
                          {isUpdating ? "Sending..." : "Send Reply"}
                        </button>
                      </div>

                      {/* Internal note box */}
                      <div className="flex flex-col gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          <StickyNote size={12} /> Internal Note (not visible to
                          user)
                        </p>
                        <textarea
                          rows={2}
                          placeholder="Add internal note…"
                          value={noteText.get(idStr) ?? ""}
                          onChange={(e) =>
                            setNoteText((prev) =>
                              new Map(prev).set(idStr, e.target.value),
                            )
                          }
                          className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                          data-ocid={`founder_tickets.note_input.${i + 1}`}
                        />
                        <button
                          type="button"
                          disabled={
                            isNoteSending || !(noteText.get(idStr) ?? "").trim()
                          }
                          onClick={() => void sendNote(t)}
                          className="self-end flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                          data-ocid={`founder_tickets.add_note.${i + 1}`}
                        >
                          <StickyNote size={13} />
                          {isNoteSending ? "Adding..." : "Add Note"}
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {kind === "Open" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => void updateStatus(t, "InProgress")}
                            className="px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                            data-ocid={`founder_tickets.mark_inprogress.${i + 1}`}
                          >
                            {isUpdating ? "Updating..." : "Mark In Progress"}
                          </button>
                        )}
                        {kind !== "Resolved" && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowResolve((prev) => {
                                const n = new Set(prev);
                                isResolveOpen ? n.delete(idStr) : n.add(idStr);
                                return n;
                              })
                            }
                            className="px-4 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-xl hover:bg-green-100 transition-colors"
                            data-ocid={`founder_tickets.open_resolve.${i + 1}`}
                          >
                            Resolve
                          </button>
                        )}
                      </div>

                      {/* Resolve form */}
                      {isResolveOpen && kind !== "Resolved" && (
                        <div className="flex flex-col gap-2 border border-green-200 rounded-xl p-3 bg-green-50">
                          <p className="text-xs font-semibold text-green-700">
                            Resolution Note (optional)
                          </p>
                          <textarea
                            rows={2}
                            placeholder="Describe how the issue was resolved…"
                            value={resolveNote.get(idStr) ?? ""}
                            onChange={(e) =>
                              setResolveNote((prev) =>
                                new Map(prev).set(idStr, e.target.value),
                              )
                            }
                            className="w-full border border-green-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                            data-ocid={`founder_tickets.resolve_note.${i + 1}`}
                          />
                          <div className="flex gap-2 self-end">
                            <button
                              type="button"
                              onClick={() =>
                                setShowResolve((prev) => {
                                  const n = new Set(prev);
                                  n.delete(idStr);
                                  return n;
                                })
                              }
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                              data-ocid={`founder_tickets.cancel_resolve.${i + 1}`}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isResolving}
                              onClick={() => void handleResolve(t)}
                              className="px-4 py-1.5 bg-[#22C55E] text-white text-sm font-medium rounded-xl hover:bg-[#16A34A] transition-colors disabled:opacity-50"
                              data-ocid={`founder_tickets.confirm_resolve.${i + 1}`}
                            >
                              {isResolving ? "Resolving..." : "Mark Resolved"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
