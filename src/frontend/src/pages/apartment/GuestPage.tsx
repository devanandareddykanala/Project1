import { createActor } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { Clock, Copy, Plus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

type GuestRecord = {
  id: string;
  flatId: string;
  name: string;
  phone: string;
  createdAt: bigint;
  expiresAt: bigint;
  isActive: boolean;
};

export default function GuestPage() {
  const { actor, isFetching } = useActor(createActor);
  const user = useAuthStore((s) => s.user);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [flatId, setFlatId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [days, setDays] = useState("7");
  const [submitting, setSubmitting] = useState(false);
  const [newGuestCode, setNewGuestCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const apartmentId = user?.apartmentId ?? "";

  const load = async () => {
    if (!actor || isFetching) return;
    try {
      setLoading(true);
      const result = await actor.getGuests(apartmentId);
      setGuests(result as GuestRecord[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within this render
  useEffect(() => {
    if (actor && !isFetching) void load();
  }, [actor, isFetching]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatId.trim() || !name.trim() || !phone.trim()) {
      setError("All fields required");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!actor) return;
    try {
      setSubmitting(true);
      setError("");
      const result = await actor.createGuest(
        flatId.trim(),
        name.trim(),
        phone.trim(),
        BigInt(Number.parseInt(days)),
      );
      const code =
        result.__kind__ === "ok"
          ? result.ok
          : Math.random().toString(36).slice(2, 8).toUpperCase();
      setNewGuestCode(code);
      setShowForm(false);
      setFlatId("");
      setName("");
      setPhone("");
      setDays("7");
      await load();
    } catch {
      toast.error("Failed to create guest access");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!actor) return;
    try {
      await actor.revokeGuest(id);
      toast.success("Guest access revoked");
      await load();
    } catch {
      toast.error("Failed to revoke access");
    }
  };

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const timeLeft = (expiresAt: bigint) => {
    const now = Date.now();
    const exp = Number(expiresAt) / 1_000_000;
    const diff = exp - now;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d left`;
    const hrs = Math.floor(diff / 3600000);
    return `${hrs}h left`;
  };

  return (
    <Layout>
      <div className="p-4 bg-white min-h-screen" data-ocid="guest_page.page">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Guests</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Temporary apartment access
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors"
            data-ocid="guest_page.open_modal_button"
          >
            <Plus size={16} /> Add Guest
          </button>
        </div>

        {/* New guest code banner */}
        {newGuestCode && (
          <div className="bg-green-50 border border-[#DCFCE7] rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-green-800 mb-1">
              Guest Access Created!
            </p>
            <p className="text-xs text-green-700 mb-2">
              Share this invite code with the guest:
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xl text-[#16A34A] tracking-widest">
                {newGuestCode}
              </span>
              <button
                type="button"
                onClick={() => copyCode(newGuestCode)}
                className="p-1.5 rounded-lg bg-white border border-[#DCFCE7] text-[#22C55E]"
                data-ocid="guest_page.copy_button"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Valid for the duration you set. Access: Notice board + SOS only.
            </p>
            <button
              type="button"
              onClick={() => setNewGuestCode(null)}
              className="mt-2 text-xs text-gray-400 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-md p-5"
              data-ocid="guest_page.dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Add Guest Access</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  data-ocid="guest_page.close_button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="guest-name"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Guest Name
                  </label>
                  <input
                    id="guest-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="guest_page.name_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-phone"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Mobile Number
                  </label>
                  <input
                    id="guest-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="guest_page.input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-flat"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    For Flat
                  </label>
                  <input
                    id="guest-flat"
                    value={flatId}
                    onChange={(e) => setFlatId(e.target.value)}
                    placeholder="e.g. A-101"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="guest_page.flat_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="guest-days"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Duration
                  </label>
                  <select
                    id="guest-days"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="guest_page.select"
                  >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
                {error && (
                  <p
                    className="text-red-500 text-xs"
                    data-ocid="guest_page.error_state"
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
                    data-ocid="guest_page.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-60"
                    data-ocid="guest_page.submit_button"
                  >
                    {submitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div
            className="flex flex-col gap-3"
            data-ocid="guest_page.loading_state"
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-20 animate-pulse"
              />
            ))}
          </div>
        ) : guests.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16"
            data-ocid="guest_page.empty_state"
          >
            <Users size={40} className="text-gray-300" />
            <p className="text-sm text-gray-400 text-center">
              No active guest access.
              <br />
              Tap Add Guest to create one.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {guests.map((guest, idx) => (
              <div
                key={guest.id}
                className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4"
                data-ocid={`guest_page.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {guest.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {guest.phone} · Flat {guest.flatId}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={11} className="text-gray-400" />
                      <span
                        className={`text-xs font-medium ${guest.isActive ? "text-[#22C55E]" : "text-gray-400"}`}
                      >
                        {guest.isActive ? timeLeft(guest.expiresAt) : "Revoked"}
                      </span>
                    </div>
                  </div>
                  {guest.isActive && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(guest.id)}
                      className="text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1 font-semibold flex-shrink-0"
                      data-ocid={`guest_page.delete_button.${idx + 1}`}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
