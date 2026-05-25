import { createActor } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { Car, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

type ParkingSlot = {
  id: bigint;
  slotNumber: string;
  assignedFlatId?: bigint;
};

export function ParkingManagement() {
  const user = useAuthStore((s) => s.user);
  const { actor } = useActor(createActor);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [flatId, setFlatId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  type ModalState = {
    mode: "assign" | "edit" | "add";
    slotId: bigint;
    slotNumber?: string;
  } | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [newSlotNumber, setNewSlotNumber] = useState("");

  const isSuperAdmin = user?.role === "super_admin";

  // Derived values
  const myFlat = user?.flatId ? BigInt(String(user.flatId)) : null;
  const visibleSlots = isSuperAdmin
    ? slots
    : slots.filter(
        (s) =>
          s.assignedFlatId !== undefined &&
          myFlat !== null &&
          s.assignedFlatId === myFlat,
      );
  const assignedCount = slots.filter((s) => s.assignedFlatId).length;
  const freeCount = slots.filter((s) => !s.assignedFlatId).length;

  // Modal helpers
  const openAssign = (slot: ParkingSlot) => {
    setModal({ mode: "assign", slotId: slot.id });
    setFlatId("");
  };
  const openEdit = (slot: ParkingSlot) => {
    setModal({ mode: "edit", slotId: slot.id });
    setFlatId(
      slot.assignedFlatId !== undefined ? String(slot.assignedFlatId) : "",
    );
  };
  const openAddSlot = () => {
    setModal({ mode: "add", slotId: 0n });
    setNewSlotNumber("");
  };
  const closeModal = () => {
    setModal(null);
    setFlatId("");
    setNewSlotNumber("");
  };

  const handleAssignOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId.trim() || !modal || !actor) return;
    try {
      setSubmitting(true);
      await actor.assignParking(modal.slotId, BigInt(flatId.trim()));
      toast.success(
        modal.mode === "edit" ? "Assignment updated" : "Slot assigned",
      );
      closeModal();
      await load();
    } catch {
      toast.error("Failed to save assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    closeModal();
    toast.info("Parking slot management coming in next update");
  };

  const load = async () => {
    if (!actor) return;
    try {
      setLoading(true);
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const raw = await actor.getParkingSlots(aptId);
      setSlots(
        raw.map((s) => ({
          id: s.id,
          slotNumber: s.slotNumber,
          assignedFlatId: s.assignedTo?.[0] ?? undefined,
        })),
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within this render
  useEffect(() => {
    void load();
  }, [actor, user?.apartmentId]);

  if (!actor) return <div>Loading...</div>;

  const handleUnassign = async (slotId: bigint) => {
    try {
      await actor.unassignParking(slotId);
      toast.success("Slot unassigned");
      await load();
    } catch {
      toast.error("Failed to unassign");
    }
  };

  return (
    <Layout>
      <div
        className="p-4 bg-white min-h-screen"
        data-ocid="parking_management.page"
      >
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">Parking</h1>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={openAddSlot}
              className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors"
              data-ocid="parking_management.open_modal_button"
            >
              <Plus size={15} /> Add Slot
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">Parking slot assignments</p>

        {isSuperAdmin && !loading && slots.length > 0 && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-white rounded-xl border border-[#DCFCE7] p-3 text-center">
              <p className="text-lg font-bold text-[#16A34A]">
                {assignedCount}
              </p>
              <p className="text-xs text-gray-500">Assigned</p>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-lg font-bold text-gray-700">{freeCount}</p>
              <p className="text-xs text-gray-500">Free</p>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-lg font-bold text-gray-700">{slots.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        )}

        {loading ? (
          <div
            className="grid grid-cols-2 gap-3"
            data-ocid="parking_management.loading_state"
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-28 animate-pulse"
              />
            ))}
          </div>
        ) : visibleSlots.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16"
            data-ocid="parking_management.empty_state"
          >
            <Car size={48} className="text-gray-300" />
            {isSuperAdmin ? (
              <>
                <p className="text-sm text-gray-400 text-center">
                  No parking slots configured yet.
                </p>
                <button
                  type="button"
                  onClick={openAddSlot}
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors"
                  data-ocid="parking_management.add_first_button"
                >
                  Add First Slot
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center">
                No parking slot assigned to your flat yet.
                <br />
                Contact your Super Admin.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleSlots.map((slot, idx) => (
              <div
                key={slot.id}
                className={`rounded-xl border p-3 flex flex-col gap-1.5 ${
                  slot.assignedFlatId !== undefined
                    ? "bg-white border-[#DCFCE7]"
                    : "bg-white border-gray-200"
                }`}
                data-ocid={`parking_management.item.${idx + 1}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    Slot {slot.slotNumber}
                  </span>
                  <span
                    className={`text-xs font-semibold ${slot.assignedFlatId ? "text-[#22C55E]" : "text-gray-400"}`}
                  >
                    {slot.assignedFlatId ? "Taken" : "Free"}
                  </span>
                </div>
                {slot.assignedFlatId ? (
                  <>
                    <p className="text-xs text-gray-600 font-medium">
                      Flat {String(slot.assignedFlatId)}
                    </p>

                    {isSuperAdmin && (
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => openEdit(slot)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#22C55E] transition-colors"
                          data-ocid={`parking_management.edit_button.${idx + 1}`}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnassign(slot.id)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                          data-ocid={`parking_management.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={11} /> Unassign
                        </button>
                      </div>
                    )}
                  </>
                ) : isSuperAdmin ? (
                  <button
                    type="button"
                    onClick={() => openAssign(slot)}
                    className="flex items-center gap-1 text-xs text-[#22C55E] font-semibold mt-1"
                    data-ocid={`parking_management.assign_button.${idx + 1}`}
                  >
                    <Plus size={12} /> Assign Flat
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5"
              data-ocid="parking_management.dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">
                  {modal.mode === "add"
                    ? "Add Parking Slot"
                    : modal.mode === "edit"
                      ? "Edit Assignment"
                      : "Assign Slot"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  data-ocid="parking_management.close_button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              {modal.mode === "add" ? (
                <form onSubmit={handleAddSlot} className="flex flex-col gap-3">
                  <div>
                    <label
                      htmlFor="new-slot-num"
                      className="text-xs font-medium text-gray-600 mb-1 block"
                    >
                      Slot Number / Label
                    </label>
                    <input
                      id="new-slot-num"
                      value={newSlotNumber}
                      onChange={(e) => setNewSlotNumber(e.target.value)}
                      placeholder="e.g. A1, B-12, Visitor-1"
                      className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                      data-ocid="parking_management.slot_number_input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 border border-[#DCFCE7] text-gray-700 font-semibold rounded-lg py-2 text-sm"
                      data-ocid="parking_management.cancel_button"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-60"
                      data-ocid="parking_management.submit_button"
                    >
                      {submitting ? "Adding..." : "Add Slot"}
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleAssignOrEdit}
                  className="flex flex-col gap-3"
                >
                  <div>
                    <label
                      htmlFor="parking-flat"
                      className="text-xs font-medium text-gray-600 mb-1 block"
                    >
                      Flat Number
                    </label>
                    <input
                      id="parking-flat"
                      value={flatId}
                      onChange={(e) => setFlatId(e.target.value)}
                      placeholder="e.g. A-101"
                      className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                      data-ocid="parking_management.flat_input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 border border-[#DCFCE7] text-gray-700 font-semibold rounded-lg py-2 text-sm"
                      data-ocid="parking_management.cancel_button"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-60"
                      data-ocid="parking_management.submit_button"
                    >
                      {submitting
                        ? "Saving..."
                        : modal.mode === "edit"
                          ? "Update"
                          : "Assign"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ParkingManagement;
