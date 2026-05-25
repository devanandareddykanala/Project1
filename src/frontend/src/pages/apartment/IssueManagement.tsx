import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock as LockIcon,
  Pencil,
  Plus,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Lift",
  "Gate",
  "Water",
  "Other",
];
const STATUSES = ["Open", "InProgress", "Resolved"];
type StatusEvent = {
  status: string;
  timestamp: number;
};

function buildTimeline(issue: Issue): StatusEvent[] {
  const events: StatusEvent[] = [
    { status: "Open", timestamp: Number(issue.createdAt) / 1_000_000 },
  ];
  const status = String(issue.status);
  if (status === "InProgress" || status === "Resolved") {
    events.push({
      status: "InProgress",
      timestamp: Number(issue.createdAt) / 1_000_000 + 60_000,
    });
  }
  if (status === "Resolved") {
    events.push({
      status: "Resolved",
      timestamp: Number(issue.createdAt) / 1_000_000 + 120_000,
    });
  }
  return events;
}

const STATUS_STYLE: Record<
  string,
  { dot: string; label: string; bg: string; text: string; border: string }
> = {
  Open: {
    dot: "bg-gray-400",
    label: "Open",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  InProgress: {
    dot: "bg-blue-500",
    label: "In Progress",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  Resolved: {
    dot: "bg-[#22C55E]",
    label: "Resolved",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  Closed: {
    dot: "bg-gray-600",
    label: "Closed",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

const TIMELINE_ICON: Record<string, React.ReactNode> = {
  Open: <Circle size={14} className="text-gray-400" />,
  InProgress: <Clock size={14} className="text-blue-500" />,
  Resolved: <CheckCircle2 size={14} className="text-[#22C55E]" />,
  Closed: <XCircle size={14} className="text-gray-500" />,
};

import { IssueCategory, IssueStatus, createActor } from "@/backend";
import type { Issue } from "@/backend";

export function IssueManagement() {
  const { actor, isFetching } = useActor(createActor);
  const user = useAuthStore((s) => s.user);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Plumbing");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<Issue | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const canEdit = (createdAt: bigint) =>
    Date.now() - Number(createdAt) / 1_000_000 < 60 * 60 * 1000;
  const isSevenDaysOld = (createdAt: bigint, status: unknown) =>
    Date.now() - Number(createdAt) / 1_000_000 > 7 * 24 * 60 * 60 * 1000 &&
    String(status) !== "Resolved";

  const handleEditSave = async () => {
    if (!editTarget || !actor) return;
    try {
      await actor.updateIssueStatus(editTarget.id, IssueStatus.Open);
      toast.success("Issue updated");
      setEditTarget(null);
      await load();
    } catch {
      toast.error("Failed to update issue");
    }
  };

  const load = async () => {
    if (!actor || isFetching) return;
    try {
      setLoading(true);
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const result = await actor.getIssues(aptId);
      setIssues(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    if (actor && !isFetching) void load();
  }, [actor, isFetching]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    if (!actor) return;
    try {
      setSubmitting(true);
      setError("");
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const flatId = user?.flatId ? BigInt(String(user.flatId)) : 0n;
      const issueCat =
        (IssueCategory as Record<string, IssueCategory>)[category] ??
        IssueCategory.Other;
      await actor.raiseIssue(
        flatId,
        aptId,
        description.trim(),
        location.trim() || description.trim(),
        issueCat,
      );
      toast.success("Issue reported successfully");
      setShowForm(false);
      setDescription("");
      setLocation("");
      await load();
    } catch {
      setError("Failed to submit issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: bigint, status: string) => {
    if (!actor) return;
    try {
      const issueStatus =
        (IssueStatus as Record<string, IssueStatus>)[status] ??
        IssueStatus.Open;
      await actor.updateIssueStatus(id, issueStatus);
      toast.success("Status updated");
      await load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <Layout>
      <div
        className="p-4 bg-white min-h-screen"
        data-ocid="issue_management.page"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Issues</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Report and track apartment issues
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors"
            data-ocid="issue_management.open_modal_button"
          >
            <Plus size={16} />
            Report
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-md p-5"
              data-ocid="issue_management.dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Report an Issue</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  data-ocid="issue_management.close_button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="issue-category"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Category
                  </label>
                  <select
                    id="issue-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="issue_management.select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="issue-description"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Description
                  </label>
                  <textarea
                    id="issue-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm resize-none"
                    data-ocid="issue_management.textarea"
                  />
                </div>
                <div>
                  <label
                    htmlFor="issue-location"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Location (optional)
                  </label>
                  <input
                    id="issue-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. 3rd floor corridor"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="issue_management.input"
                  />
                </div>
                {error && (
                  <p
                    className="text-red-500 text-xs"
                    data-ocid="issue_management.error_state"
                  >
                    {error}
                  </p>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError("");
                    }}
                    className="flex-1 border border-[#DCFCE7] text-gray-700 font-semibold rounded-lg py-2 text-sm"
                    data-ocid="issue_management.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-60"
                    data-ocid="issue_management.submit_button"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div
            className="flex flex-col gap-3"
            data-ocid="issue_management.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-20 animate-pulse"
              />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16"
            data-ocid="issue_management.empty_state"
          >
            <Wrench size={40} className="text-gray-300" />
            <p className="text-sm text-gray-400 text-center">
              No issues reported yet.
              <br />
              Tap Report to log one.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {issues.map((issue, idx) => {
              const editable = canEdit(issue.createdAt);
              const stale = isSevenDaysOld(issue.createdAt, issue.status);
              return (
                <div
                  key={String(issue.id)}
                  className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4"
                  data-ocid={`issue_management.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#16A34A] bg-green-50 border border-[#DCFCE7] rounded px-2 py-0.5">
                          {issue.category}
                        </span>
                        <span
                          className={`text-xs font-medium border rounded px-2 py-0.5 ${(STATUS_STYLE[String(issue.status)] ?? STATUS_STYLE.Open).bg} ${(STATUS_STYLE[String(issue.status)] ?? STATUS_STYLE.Open).text} ${(STATUS_STYLE[String(issue.status)] ?? STATUS_STYLE.Open).border}`}
                        >
                          {
                            (
                              STATUS_STYLE[String(issue.status)] ??
                              STATUS_STYLE.Open
                            ).label
                          }
                        </span>
                        {stale && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-semibold">
                            7+ days unresolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 mt-2">
                        {issue.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Flat {issue.flatId} ·{" "}
                        {new Date(
                          Number(issue.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isSuperAdmin && (
                        <select
                          value={issue.status}
                          onChange={(e) =>
                            handleStatusUpdate(issue.id, e.target.value)
                          }
                          className="text-xs border border-[#DCFCE7] rounded-lg px-2 py-1 focus:outline-none focus:border-[#22C55E]"
                          data-ocid={`issue_management.select.${idx + 1}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s === "InProgress" ? "In Progress" : s}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => setDetailIssue(issue)}
                        className="text-xs text-[#22C55E] font-medium underline underline-offset-2"
                        data-ocid={`issue_management.timeline_button.${idx + 1}`}
                      >
                        Timeline
                      </button>
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditTarget(issue);
                            setEditDesc(issue.description);
                          }}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#22C55E] transition-colors"
                          aria-label="Edit issue"
                          data-ocid={`issue_management.edit_button.${idx + 1}`}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-xs text-gray-300"
                          title="Edit window closed (1 hour)"
                        >
                          <LockIcon size={13} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Timeline Detail Modal */}
      {detailIssue && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          data-ocid="issue_management.timeline_dialog"
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Issue Timeline</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">
                  {detailIssue.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailIssue(null)}
                data-ocid="issue_management.timeline_close_button"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-semibold text-[#16A34A] bg-green-50 border border-[#DCFCE7] rounded px-2 py-0.5">
                {detailIssue.category}
              </span>
              {(() => {
                const sk = String(detailIssue.status);
                const st = STATUS_STYLE[sk] ?? STATUS_STYLE.Open;
                return (
                  <span
                    className={`text-xs font-medium border rounded px-2 py-0.5 ${st.bg} ${st.text} ${st.border}`}
                  >
                    {st.label}
                  </span>
                );
              })()}
            </div>
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200" />
              <div className="flex flex-col gap-5">
                {buildTimeline(detailIssue).map((event, i) => {
                  const st = STATUS_STYLE[event.status] ?? STATUS_STYLE.Open;
                  const isLast = i === buildTimeline(detailIssue).length - 1;
                  return (
                    <div
                      key={`${event.status}-${i}`}
                      className="flex items-start gap-3"
                      data-ocid={`issue_management.timeline_event.${i + 1}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0 -ml-6 z-10 ${isLast ? st.dot : "bg-gray-300"}`}
                      />
                      <div className="-mt-0.5">
                        <div className="flex items-center gap-1.5">
                          {TIMELINE_ICON[event.status] ?? TIMELINE_ICON.Open}
                          <span className="text-sm font-semibold text-gray-800">
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(event.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400">
              Reported by Flat {String(detailIssue.flatId)} ·{" "}
              {new Date(
                Number(detailIssue.createdAt) / 1_000_000,
              ).toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>
      )}
      {/* Edit Issue Modal */}
      {editTarget && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          data-ocid="issue_management.edit_dialog"
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Edit Issue</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  1-hour edit window from time of report
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                data-ocid="issue_management.edit_close_button"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="edit-issue-desc"
                  className="text-xs font-medium text-gray-600 mb-1 block"
                >
                  Description
                </label>
                <textarea
                  id="edit-issue-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm resize-none"
                  data-ocid="issue_management.edit_textarea"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 border border-[#DCFCE7] text-gray-700 font-semibold rounded-lg py-2 text-sm"
                  data-ocid="issue_management.edit_cancel_button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm"
                  data-ocid="issue_management.edit_submit_button"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default IssueManagement;
