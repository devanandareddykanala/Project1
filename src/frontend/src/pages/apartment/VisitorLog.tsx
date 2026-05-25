import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import type { Visitor } from "@/types";
import {
  Lock,
  Package,
  Pencil,
  StickyNote,
  User,
  UserCheck,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const VISITOR_TYPES: {
  id: Visitor["type"];
  label: string;
  icon: typeof User;
}[] = [
  { id: "delivery", label: "Delivery", icon: Package },
  { id: "guest", label: "Guest", icon: User },
  { id: "service", label: "Service", icon: Wrench },
  { id: "unknown", label: "Unknown", icon: UserCheck },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function canEdit(loggedAt: number): boolean {
  return Date.now() - loggedAt < 30 * 60 * 1000;
}

function isNightEntry(loggedAt: number): boolean {
  const h = new Date(loggedAt).getHours();
  return h >= 23 || h < 6;
}

interface AddForm {
  name: string;
  type: Visitor["type"];
  flat: string;
  note: string;
}

interface EditForm {
  name: string;
  note: string;
}

interface NoteForm {
  note: string;
}

export function VisitorLog() {
  const { user } = useAuthStore();
  const canLog = [
    "super_admin",
    "watchman",
    "watchman_family",
    "flat_admin",
  ].includes(user?.role ?? "");
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Visitor["type"]>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>({
    name: "",
    type: "delivery",
    flat: "",
    note: "",
  });
  const [editTarget, setEditTarget] = useState<Visitor | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", note: "" });
  const [noteTarget, setNoteTarget] = useState<Visitor | null>(null);
  const [noteForm, setNoteForm] = useState<NoteForm>({ note: "" });

  // Simulate data load with skeleton
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const todayEntries = visitors.filter((v) => {
    const d = new Date(v.loggedAt);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const filtered =
    filter === "all" ? visitors : visitors.filter((v) => v.type === filter);

  const handleEdit = () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) {
      toast.error("Visitor name required");
      return;
    }
    setVisitors((p) =>
      p.map((v) =>
        v.id === editTarget.id ? { ...v, name: editForm.name.trim() } : v,
      ),
    );
    toast.success("Visitor entry updated");
    setEditTarget(null);
  };

  const handleAddNote = () => {
    if (!noteTarget) return;
    if (!noteForm.note.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    toast.success("Note added to visitor entry");
    setNoteTarget(null);
    setNoteForm({ note: "" });
  };

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast.error("Visitor name required");
      return;
    }
    if (!form.flat.trim()) {
      toast.error("Flat number required");
      return;
    }
    const v: Visitor = {
      id: `v${Date.now()}`,
      apartmentId: "a1",
      flatId: `f${form.flat}`,
      flatNumber: form.flat,
      name: form.name,
      type: form.type,
      loggedBy: user?.name ?? "Admin",
      loggedAt: Date.now(),
      status: "in",
    };
    setVisitors((p) => [v, ...p]);
    toast.success(`Visitor logged for Flat ${form.flat}`);
    setShowAdd(false);
    setForm({ name: "", type: "delivery", flat: "", note: "" });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white" data-ocid="visitors.page">
        <div className="p-4 pb-24">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Visitors</h1>
            </div>
            {canLog && (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                data-ocid="visitors.add_button"
              >
                + Log Visitor
              </button>
            )}
          </div>

          {/* Today counter */}
          <p className="text-sm text-gray-500 mb-4">
            Today:{" "}
            <span className="font-semibold text-gray-700">
              {todayEntries.length}{" "}
              {todayEntries.length === 1 ? "entry" : "entries"}
            </span>
          </p>

          {/* Filter tabs */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-4"
            data-ocid="visitors.filter_tabs"
          >
            {(["all", "delivery", "guest", "service", "unknown"] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                    filter === f
                      ? "bg-[#22C55E] text-white"
                      : "bg-white border border-[#DCFCE7] text-gray-600 hover:border-[#22C55E]"
                  }`}
                  data-ocid={`visitors.filter.${f}`}
                >
                  {f}
                </button>
              ),
            )}
          </div>

          {/* Skeleton loading */}
          {loading ? (
            <div
              className="flex flex-col gap-3"
              data-ocid="visitors.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-xl h-16 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Zero state */
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="visitors.empty_state"
            >
              {/* Gate SVG icon */}
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 opacity-40"
                aria-hidden="true"
              >
                <rect x="4" y="8" width="8" height="48" rx="2" fill="#22C55E" />
                <rect
                  x="52"
                  y="8"
                  width="8"
                  height="48"
                  rx="2"
                  fill="#22C55E"
                />
                <rect
                  x="12"
                  y="12"
                  width="18"
                  height="32"
                  rx="2"
                  fill="#DCFCE7"
                  stroke="#22C55E"
                  strokeWidth="2"
                />
                <rect
                  x="34"
                  y="12"
                  width="18"
                  height="32"
                  rx="2"
                  fill="#DCFCE7"
                  stroke="#22C55E"
                  strokeWidth="2"
                />
                <circle cx="31" cy="28" r="2" fill="#22C55E" />
                <circle cx="33" cy="28" r="2" fill="#22C55E" />
                <rect
                  x="4"
                  y="56"
                  width="56"
                  height="4"
                  rx="2"
                  fill="#16A34A"
                />
              </svg>
              <p className="text-base font-semibold text-gray-700 mb-1">
                No visitors today.
              </p>
              <p className="text-sm text-gray-400 mb-4">
                All quiet at the gate.
              </p>
              {canLog && (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors"
                  data-ocid="visitors.empty_cta_button"
                >
                  Log a Visitor
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2" data-ocid="visitors.list">
              {filtered.map((v, i) => {
                const typeInfo = VISITOR_TYPES.find((t) => t.id === v.type)!;
                const Icon = typeInfo.icon;
                const editable = canEdit(v.loggedAt);
                const nightEntry = isNightEntry(v.loggedAt);
                return (
                  <div
                    key={v.id}
                    className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 flex items-center gap-3"
                    data-ocid={`visitors.item.${i + 1}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#DCFCE7] flex items-center justify-center">
                      <Icon size={18} className="text-[#22C55E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {v.name}
                        </p>
                        {nightEntry && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-semibold">
                            🌙 Night
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Flat {v.flatNumber} · by {v.loggedBy}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] capitalize">
                        {v.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {timeAgo(v.loggedAt)}
                      </span>
                      {canLog && (
                        <div className="flex gap-1 mt-0.5">
                          {editable ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditTarget(v);
                                setEditForm({ name: v.name, note: "" });
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#22C55E] hover:bg-green-50 transition-colors"
                              aria-label="Edit visitor"
                              data-ocid={`visitors.edit_button.${i + 1}`}
                            >
                              <Pencil size={13} />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 rounded-lg text-gray-200"
                              title="Edit window closed (30 min)"
                            >
                              <Lock size={13} />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setNoteTarget(v);
                              setNoteForm({ note: "" });
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#22C55E] hover:bg-green-50 transition-colors"
                            aria-label="Add note"
                            data-ocid={`visitors.note_button.${i + 1}`}
                          >
                            <StickyNote size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Visitor Modal */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="visitors.edit_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Visitor</h2>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-gray-400 hover:text-gray-600"
                data-ocid="visitors.edit_close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
              ⏱ Edit window: 30 minutes from log time. Visitor log is permanent
              after.
            </div>
            <div>
              <label
                htmlFor="edit-vis-name"
                className="text-xs text-gray-500 mb-1 block"
              >
                Visitor Name
              </label>
              <input
                id="edit-vis-name"
                placeholder="Full name or description"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                data-ocid="visitors.edit_name_input"
              />
            </div>
            <button
              type="button"
              onClick={handleEdit}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors"
              data-ocid="visitors.edit_submit_button"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="visitors.note_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Note</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {noteTarget.name} — Flat {noteTarget.flatNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNoteTarget(null)}
                className="text-gray-400 hover:text-gray-600"
                data-ocid="visitors.note_close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label
                htmlFor="add-note"
                className="text-xs text-gray-500 mb-1 block"
              >
                Note
              </label>
              <textarea
                id="add-note"
                rows={3}
                placeholder="e.g. Verified ID, returned package"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm resize-none"
                value={noteForm.note}
                onChange={(e) => setNoteForm({ note: e.target.value })}
                data-ocid="visitors.note_textarea"
              />
            </div>
            <button
              type="button"
              onClick={handleAddNote}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors"
              data-ocid="visitors.note_submit_button"
            >
              Add Note
            </button>
          </div>
        </div>
      )}

      {/* Add Visitor Sheet */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="visitors.add_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Log Visitor</h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-600"
                data-ocid="visitors.close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label
                htmlFor="vis-name"
                className="text-xs text-gray-500 mb-1 block"
              >
                Visitor Name
              </label>
              <input
                id="vis-name"
                placeholder="Full name or description"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-ocid="visitors.name_input"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Type</p>
              <div className="grid grid-cols-4 gap-2">
                {VISITOR_TYPES.map((t) => {
                  const Icon = t.icon;
                  const sel = form.type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.id })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                        sel
                          ? "bg-[#f0fdf4] border border-[#22C55E] text-[#22C55E]"
                          : "bg-gray-50 border border-gray-200 text-gray-500"
                      }`}
                      data-ocid={`visitors.type.${t.id}`}
                    >
                      <Icon size={20} />
                      <span className="text-xs">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label
                htmlFor="vis-flat"
                className="text-xs text-gray-500 mb-1 block"
              >
                Flat Number
              </label>
              <input
                id="vis-flat"
                placeholder="e.g. 101"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={form.flat}
                onChange={(e) => setForm({ ...form, flat: e.target.value })}
                data-ocid="visitors.flat_input"
              />
            </div>
            <div>
              <label
                htmlFor="vis-note"
                className="text-xs text-gray-500 mb-1 block"
              >
                Note (optional)
              </label>
              <input
                id="vis-note"
                placeholder="e.g. Swiggy order, plumber visit"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                data-ocid="visitors.note_input"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors"
              data-ocid="visitors.submit_button"
            >
              Log Visitor
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
