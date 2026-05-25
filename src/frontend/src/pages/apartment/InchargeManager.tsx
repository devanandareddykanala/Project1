import { createActor } from "@/backend";
import type { InchargeRecord } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  Archive,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  RotateCcw,
  UserCog,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

export function InchargeManager() {
  const user = useAuthStore((s) => s.user);
  const { actor } = useActor(createActor);
  const [records, setRecords] = useState<InchargeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRotate, setShowRotate] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isSuperAdmin = user?.role === "super_admin";

  // Tabs
  const [activeTab, setActiveTab] = useState<"current" | "archive" | "upi">(
    "current",
  );

  // UPI management
  const [newUpiId, setNewUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;

  // Handover checklist — keyed by string item
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const HANDOVER_CHECKLIST = [
    "Keys and access cards handed over",
    "Maintenance payment ledger reviewed",
    "UPI ID archived / updated",
    "Open issues briefed to incoming incharge",
    "Visitor log reviewed",
    "Shift handover notes added",
  ];

  const toggleCheck = (item: string) =>
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  const allChecked = HANDOVER_CHECKLIST.every((item) => !!checklist[item]);

  // UPI archive — derived from record handoverNotes for past entries
  type UpiArchiveEntry = { upiId: string; userId: string; archivedAt: string };
  const upiArchive: UpiArchiveEntry[] = records
    .filter((r) => !r.isActive && r.handoverNotes)
    .map((r) => ({
      upiId: r.handoverNotes as string,
      userId: String(r.userId),
      archivedAt: new Date(
        Number(r.endDate ?? r.startDate) / 1_000_000,
      ).toLocaleDateString("en-IN"),
    }));

  const current = records.find((r) => r.isActive) ?? null;
  const archive = records.filter((r) => !r.isActive);

  const load = async () => {
    if (!actor) return;
    try {
      setLoading(true);
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const result = await actor.getInchargeHistory(aptId);
      setRecords(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable
  useEffect(() => {
    void load();
  }, [actor, user?.apartmentId]);

  if (!actor) return <div>Loading...</div>;

  const handleRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      setError("User ID is required");
      return;
    }
    if (newUpiId && !UPI_REGEX.test(newUpiId.trim())) {
      setUpiError("Invalid UPI ID format (e.g. name@okaxis)");
      return;
    }
    try {
      setSubmitting(true);
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const userId = BigInt(newUserId.trim());
      await actor.assignIncharge(
        aptId,
        userId,
        BigInt(Date.now()) * 1_000_000n,
      );
      toast.success("Incharge assigned successfully");
      setShowRotate(false);
      setNewUserId("");
      setNewUpiId("");
      setUpiError("");
      setChecklist({});
      setError("");
      await load();
    } catch {
      toast.error("Failed to assign incharge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div
        className="p-4 bg-white min-h-screen"
        data-ocid="incharge_manager.page"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Incharge</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Rotating incharge management
            </p>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowRotate(true)}
              className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors"
              data-ocid="incharge_manager.open_modal_button"
            >
              <RotateCcw size={15} /> Rotate
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {(["current", "archive", "upi"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-white text-[#16A34A] shadow-sm"
                  : "text-gray-500"
              }`}
              data-ocid={`incharge_manager.tab.${tab}`}
            >
              {tab === "upi"
                ? "UPI Archive"
                : tab === "current"
                  ? "Current"
                  : "History"}
            </button>
          ))}
        </div>

        {/* Current Tab */}
        {activeTab === "current" && (
          <div>
            {loading ? (
              <div
                className="bg-gray-100 rounded-2xl h-32 animate-pulse"
                data-ocid="incharge_manager.loading_state"
              />
            ) : current ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center">
                    <UserCog size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Incharge</p>
                    <p className="font-bold text-gray-900">
                      User #{String(current.userId)}
                    </p>
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-xs text-[#22C55E] font-medium">
                    <CheckCircle2 size={12} /> Active
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Since</span>
                    <span className="font-medium text-gray-800">
                      {new Date(
                        Number(current.startDate) / 1_000_000,
                      ).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {current.handoverNotes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">UPI ID</span>
                      <span className="font-medium text-gray-800 font-mono text-xs">
                        {current.handoverNotes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-3 py-12"
                data-ocid="incharge_manager.empty_state"
              >
                <UserCog size={40} className="text-gray-300" />
                <p className="text-sm text-gray-400 text-center">
                  No incharge assigned yet.
                </p>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowRotate(true)}
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-4 py-2 text-sm"
                    data-ocid="incharge_manager.assign_button"
                  >
                    Assign Incharge
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "archive" && (
          <div>
            {archive.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-12"
                data-ocid="incharge_manager.archive_empty_state"
              >
                <Archive size={36} className="text-gray-300" />
                <p className="text-sm text-gray-400">
                  No past incharge records.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {archive.map((rec, idx) => (
                  <div
                    key={String(rec.id)}
                    className="bg-white rounded-xl border border-[#DCFCE7] p-3 flex items-center justify-between"
                    data-ocid={`incharge_manager.item.${idx + 1}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        User #{String(rec.userId)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(
                          Number(rec.startDate) / 1_000_000,
                        ).toLocaleDateString("en-IN")}
                        {" — "}
                        {rec.endDate
                          ? new Date(
                              Number(rec.endDate) / 1_000_000,
                            ).toLocaleDateString("en-IN")
                          : "Present"}
                      </p>
                    </div>
                    {rec.handoverNotes && (
                      <span className="text-xs text-gray-500 font-mono">
                        {rec.handoverNotes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPI Archive Tab */}
        {activeTab === "upi" && (
          <>
            <div className="bg-[#F0FDF4] rounded-xl border border-[#DCFCE7] p-3 mb-4 flex items-start gap-2">
              <IndianRupee size={15} className="text-[#22C55E] mt-0.5" />
              <p className="text-xs text-gray-600">
                UPI IDs used by past incharges are archived here for audit and
                reference.
              </p>
            </div>
            {upiArchive.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-12"
                data-ocid="incharge_manager.upi_empty_state"
              >
                <IndianRupee size={36} className="text-gray-300" />
                <p className="text-sm text-gray-400">
                  No UPI archive entries yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upiArchive.map((entry, idx) => (
                  <div
                    key={`${entry.upiId}-${idx}`}
                    className="bg-white rounded-xl border border-[#DCFCE7] p-3 flex items-center justify-between"
                    data-ocid={`incharge_manager.upi_item.${idx + 1}`}
                  >
                    <div>
                      <p className="text-sm font-mono font-medium text-gray-800">
                        {entry.upiId}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        User #{entry.userId} · Archived {entry.archivedAt}
                      </p>
                    </div>
                    <Archive size={14} className="text-gray-300" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Rotate Modal */}
        {showRotate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-md p-5"
              data-ocid="incharge_manager.dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">Rotate Incharge</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Complete checklist before confirming
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRotate(false);
                    setError("");
                    setUpiError("");
                    setChecklist({});
                  }}
                  data-ocid="incharge_manager.close_button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleRotate} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="incharge-userid"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    User ID of New Incharge
                  </label>
                  <input
                    id="incharge-userid"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="Numeric user ID"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="incharge_manager.userid_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="incharge-upi"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    New UPI ID (optional)
                  </label>
                  <input
                    id="incharge-upi"
                    value={newUpiId}
                    onChange={(e) => {
                      setNewUpiId(e.target.value);
                      setUpiError("");
                    }}
                    placeholder="e.g. name@okaxis"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm font-mono"
                    data-ocid="incharge_manager.upi_input"
                  />
                  {upiError && (
                    <p
                      className="text-red-500 text-xs mt-1"
                      data-ocid="incharge_manager.upi_error_state"
                    >
                      {upiError}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                    <ClipboardList size={12} /> Handover Checklist
                  </p>
                  <div className="flex flex-col gap-2">
                    {HANDOVER_CHECKLIST.map((item) => (
                      <label
                        key={item}
                        className="flex items-start gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!!checklist[item]}
                          onChange={() => toggleCheck(item)}
                          className="mt-0.5 accent-[#22C55E] w-4 h-4"
                        />
                        <span className="text-xs text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                  {!allChecked && (
                    <p className="text-xs text-amber-600 mt-2">
                      Complete all checklist items before rotating.
                    </p>
                  )}
                </div>
                {error && (
                  <p
                    className="text-red-500 text-xs"
                    data-ocid="incharge_manager.error_state"
                  >
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRotate(false);
                      setError("");
                      setUpiError("");
                      setChecklist({});
                    }}
                    className="flex-1 border border-[#DCFCE7] text-gray-700 font-semibold rounded-lg py-2 text-sm"
                    data-ocid="incharge_manager.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !allChecked}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-50 transition-colors"
                    data-ocid="incharge_manager.submit_button"
                  >
                    {submitting ? "Assigning..." : "Confirm Rotation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default InchargeManager;
