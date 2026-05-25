import { createActor } from "@/backend";
import type { DisputeNote as BackendDisputeNote } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { CheckCircle2, ChevronUp, Plus, Scale, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

const DISPUTE_CATEGORIES = [
  "Maintenance",
  "Noise",
  "Parking",
  "Water",
  "Billing",
  "Safety",
  "Other",
];

type DisputeRecord = {
  id: string;
  flatId: string;
  category: string;
  description: string;
  status: string;
  tier: bigint;
  notes: BackendDisputeNote[];
  createdAt: bigint;
};

export default function DisputePage() {
  const { actor, isFetching } = useActor(createActor);
  const user = useAuthStore((s) => s.user);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [flatId, setFlatId] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isSuperAdmin = user?.role === "super_admin";

  const load = async () => {
    if (!actor || isFetching) return;
    try {
      setLoading(true);
      const result = await actor.getDisputes(null);
      setDisputes(result);
    } catch {
      // silent
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
    if (!flatId.trim() || !description.trim()) {
      setError("All fields required");
      return;
    }
    if (!actor) return;
    try {
      setSubmitting(true);
      await actor.createDispute(
        flatId.trim(),
        category,
        description.trim(),
        null,
      );
      toast.success("Dispute filed");
      setShowForm(false);
      setFlatId("");
      setDescription("");
      setError("");
      await load();
    } catch {
      toast.error("Failed to file dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (id: string) => {
    const n = note[id]?.trim();
    if (!n || !actor) return;
    try {
      await actor.addDisputeNote(id, n, null);
      setNote((prev) => ({ ...prev, [id]: "" }));
      toast.success("Note added");
      await load();
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleEscalate = async (id: string) => {
    if (!actor) return;
    try {
      await actor.escalateDispute(id);
      toast.success("Dispute escalated");
      await load();
    } catch {
      toast.error("Failed to escalate");
    }
  };

  const handleResolve = async (id: string) => {
    if (!actor) return;
    try {
      await actor.resolveDispute(id, "Resolved by admin");
      toast.success("Dispute resolved");
      await load();
    } catch {
      toast.error("Failed to resolve");
    }
  };

  const tierLabel = (tier: bigint) => {
    const t = Number(tier);
    if (t === 1)
      return {
        label: "Flat Admin",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    if (t === 2)
      return {
        label: "Super Admin",
        color: "bg-orange-50 text-orange-700 border-orange-200",
      };
    return {
      label: "Founder Portal",
      color: "bg-red-50 text-red-700 border-red-200",
    };
  };

  return (
    <Layout>
      <div className="p-4 bg-white min-h-screen" data-ocid="dispute_page.page">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Disputes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              3-tier resolution system
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors"
            data-ocid="dispute_page.open_modal_button"
          >
            <Plus size={16} /> File
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-md p-5"
              data-ocid="dispute_page.dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">File a Dispute</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  data-ocid="dispute_page.close_button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="dispute-flat"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Flat Number
                  </label>
                  <input
                    id="dispute-flat"
                    value={flatId}
                    onChange={(e) => setFlatId(e.target.value)}
                    placeholder="e.g. A-101"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="dispute_page.flat_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dispute-category"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Category
                  </label>
                  <select
                    id="dispute-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="dispute_page.select"
                  >
                    {DISPUTE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="dispute-description"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Description
                  </label>
                  <textarea
                    id="dispute-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the dispute..."
                    rows={3}
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm resize-none"
                    data-ocid="dispute_page.textarea"
                  />
                </div>
                {error && (
                  <p
                    className="text-red-500 text-xs"
                    data-ocid="dispute_page.error_state"
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
                    data-ocid="dispute_page.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-60"
                    data-ocid="dispute_page.submit_button"
                  >
                    {submitting ? "Filing..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div
            className="flex flex-col gap-3"
            data-ocid="dispute_page.loading_state"
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-24 animate-pulse"
              />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16"
            data-ocid="dispute_page.empty_state"
          >
            <Scale size={40} className="text-gray-300" />
            <p className="text-sm text-gray-400 text-center">
              No disputes filed yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {disputes.map((dispute, idx) => {
              const tier = tierLabel(dispute.tier);
              const isResolved = dispute.status === "Resolved";
              return (
                <div
                  key={dispute.id}
                  className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4"
                  data-ocid={`dispute_page.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#16A34A] bg-green-50 border border-[#DCFCE7] rounded px-2 py-0.5">
                          {dispute.category}
                        </span>
                        <span
                          className={`text-xs font-medium border rounded px-2 py-0.5 ${tier.color}`}
                        >
                          {tier.label}
                        </span>
                        {isResolved && (
                          <span className="text-xs text-green-700 bg-green-50 border border-[#DCFCE7] rounded px-2 py-0.5 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Flat {dispute.flatId}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-2">
                    {dispute.description}
                  </p>

                  {dispute.notes.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-2 mb-2">
                      {dispute.notes.map((n, ni) => (
                        <p
                          key={`note-${n.note.slice(0, 20)}-${ni}`}
                          className="text-xs text-gray-600 mb-1 last:mb-0"
                        >
                          · {n.note}
                        </p>
                      ))}
                    </div>
                  )}

                  {!isResolved && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex gap-2">
                        <input
                          value={note[dispute.id] ?? ""}
                          onChange={(e) =>
                            setNote((prev) => ({
                              ...prev,
                              [dispute.id]: e.target.value,
                            }))
                          }
                          placeholder="Add a note..."
                          className="flex-1 border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-1.5 text-xs"
                          data-ocid={`dispute_page.note_input.${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddNote(dispute.id)}
                          className="bg-[#22C55E] text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                          data-ocid={`dispute_page.save_button.${idx + 1}`}
                        >
                          Add
                        </button>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex gap-2">
                          {Number(dispute.tier) < 3 && (
                            <button
                              type="button"
                              onClick={() => handleEscalate(dispute.id)}
                              className="flex items-center gap-1 text-xs text-orange-600 border border-orange-200 rounded-lg px-3 py-1.5 font-semibold"
                              data-ocid={`dispute_page.escalate_button.${idx + 1}`}
                            >
                              <ChevronUp size={12} />
                              Escalate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleResolve(dispute.id)}
                            className="flex items-center gap-1 text-xs text-[#22C55E] border border-[#DCFCE7] rounded-lg px-3 py-1.5 font-semibold"
                            data-ocid={`dispute_page.resolve_button.${idx + 1}`}
                          >
                            <CheckCircle2 size={12} />
                            Resolve
                          </button>
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
