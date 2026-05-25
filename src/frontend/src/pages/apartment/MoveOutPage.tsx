import { createActor } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { CheckSquare, LogOut, Square, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

const _DEFAULT_CHECKLIST = [
  "All dues cleared",
  "Security deposit settled",
  "Keys returned",
  "Access cards / tags returned",
  "Final meter readings recorded",
];

type ChecklistState = {
  flatId: string;
  items: { item: string; completed: boolean }[];
  initiatedAt: bigint;
  completedAt?: bigint;
};

export default function MoveOutPage() {
  const { actor, isFetching } = useActor(createActor);
  const user = useAuthStore((s) => s.user);
  const [flats, setFlats] = useState<string[]>([]);
  const [selectedFlat, setSelectedFlat] = useState("");
  const [checklist, setChecklist] = useState<ChecklistState | null>(null);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [showMoveIn, setShowMoveIn] = useState(false);
  const [moveInName, setMoveInName] = useState("");
  const [moveInSubmitting, setMoveInSubmitting] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!actor || isFetching) return;
    const loadFlats = async () => {
      try {
        const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
        const result = await actor.getFlats(aptId);
        setFlats(result.map((f) => f.flatNumber));
      } catch {
        // silent
      }
    };
    void loadFlats();
  }, [actor, isFetching]);

  const loadChecklist = async (flat: string) => {
    if (!flat || !actor) return;
    try {
      setLoading(true);
      const result = await actor.getMoveOutChecklist(flat);
      setChecklist((result as ChecklistState) ?? null);
    } catch {
      setChecklist(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFlatChange = (flat: string) => {
    setSelectedFlat(flat);
    void loadChecklist(flat);
  };

  const handleInitiate = async () => {
    if (!selectedFlat || !actor) return;
    try {
      setInitiating(true);
      await actor.initiateMovOut(selectedFlat);
      toast.success("Move-out process initiated");
      await loadChecklist(selectedFlat);
    } catch {
      toast.error("Failed to initiate move-out");
    } finally {
      setInitiating(false);
    }
  };

  const handleCheckItem = async (item: string) => {
    if (!checklist || !actor) return;
    try {
      await actor.completeChecklistItem(selectedFlat, item);
      await loadChecklist(selectedFlat);
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleCompleteMoveOut = async () => {
    if (!actor) return;
    try {
      await actor.completeMovOut(selectedFlat);
      toast.success("Move-out completed");
      await loadChecklist(selectedFlat);
    } catch {
      toast.error("Failed to complete move-out");
    }
  };

  const handleMoveIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveInName.trim() || !actor) return;
    try {
      setMoveInSubmitting(true);
      await actor.initiateMovIn(selectedFlat, "", moveInName.trim());
      toast.success("New resident invitation sent");
      setShowMoveIn(false);
      setMoveInName("");
    } catch {
      toast.error("Failed to initiate move-in");
    } finally {
      setMoveInSubmitting(false);
    }
  };

  const allDone = checklist?.items.every((i) => i.completed) ?? false;

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div
          className="p-4 bg-white min-h-screen flex flex-col items-center justify-center"
          data-ocid="move_out.page"
        >
          <LogOut size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 text-center">
            Only Super Admin can manage move-out.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 bg-white min-h-screen" data-ocid="move_out.page">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Move Out</h1>
        <p className="text-sm text-gray-500 mb-4">Checklist and handover</p>

        <div className="mb-4">
          <label
            htmlFor="move-out-flat"
            className="text-xs font-medium text-gray-600 mb-1 block"
          >
            Select Flat
          </label>
          <select
            id="move-out-flat"
            value={selectedFlat}
            onChange={(e) => handleFlatChange(e.target.value)}
            className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
            data-ocid="move_out.select"
          >
            <option value="">Choose a flat...</option>
            {flats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {selectedFlat && !loading && !checklist && (
          <div
            className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-5 text-center"
            data-ocid="move_out.empty_state"
          >
            <LogOut size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              No active move-out process for Flat {selectedFlat}.
            </p>
            <button
              type="button"
              onClick={handleInitiate}
              disabled={initiating}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-5 py-2 text-sm disabled:opacity-60"
              data-ocid="move_out.primary_button"
            >
              {initiating ? "Initiating..." : "Start Move-Out Process"}
            </button>
          </div>
        )}

        {loading && (
          <div
            className="bg-gray-100 rounded-xl h-32 animate-pulse"
            data-ocid="move_out.loading_state"
          />
        )}

        {checklist && !loading && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">
                  Checklist — Flat {selectedFlat}
                </p>
                <span className="text-xs text-[#22C55E] font-semibold">
                  {checklist.items.filter((i) => i.completed).length}/
                  {checklist.items.length} done
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {checklist.items.map((item, idx) => (
                  <button
                    key={item.item}
                    type="button"
                    onClick={() =>
                      !item.completed && handleCheckItem(item.item)
                    }
                    className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${item.completed ? "opacity-60" : "hover:bg-green-50"}`}
                    data-ocid={`move_out.checkbox.${idx + 1}`}
                  >
                    {item.completed ? (
                      <CheckSquare
                        size={18}
                        className="text-[#22C55E] flex-shrink-0"
                      />
                    ) : (
                      <Square
                        size={18}
                        className="text-gray-400 flex-shrink-0"
                      />
                    )}
                    <span
                      className={`text-sm ${item.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                    >
                      {item.item}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {allDone && !checklist.completedAt && (
              <button
                type="button"
                onClick={handleCompleteMoveOut}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl py-3 text-sm mb-4"
                data-ocid="move_out.confirm_button"
              >
                Complete Move Out
              </button>
            )}

            {checklist.completedAt && (
              <div className="bg-green-50 border border-[#DCFCE7] rounded-xl p-4 mb-4 flex items-center gap-3">
                <CheckSquare size={20} className="text-[#22C55E]" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Move-out complete
                  </p>
                  <p className="text-xs text-green-600">
                    {new Date(
                      Number(checklist.completedAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {checklist.completedAt && (
              <button
                type="button"
                onClick={() => setShowMoveIn(true)}
                className="w-full border border-[#DCFCE7] text-[#22C55E] font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2"
                data-ocid="move_out.secondary_button"
              >
                <UserPlus size={16} /> Set Up Move-In
              </button>
            )}
          </>
        )}

        {showMoveIn && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5"
              data-ocid="move_out.dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">
                  New Resident Move-In
                </h2>
                <button
                  type="button"
                  onClick={() => setShowMoveIn(false)}
                  data-ocid="move_out.close_button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleMoveIn} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="move-in-name"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    New Resident Name
                  </label>
                  <input
                    id="move-in-name"
                    value={moveInName}
                    onChange={(e) => setMoveInName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="move_out.name_input"
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowMoveIn(false)}
                    className="flex-1 border border-[#DCFCE7] text-gray-700 font-semibold rounded-lg py-2 text-sm"
                    data-ocid="move_out.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={moveInSubmitting}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-60"
                    data-ocid="move_out.submit_button"
                  >
                    {moveInSubmitting ? "Sending..." : "Send Invite"}
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
