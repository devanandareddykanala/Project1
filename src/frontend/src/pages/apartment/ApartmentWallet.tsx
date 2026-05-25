import { createActor } from "@/backend";
import { WalletEntryType } from "@/backend";
import type { WalletEntry } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FilePen,
  Lock,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

type WalletSummary = {
  balance: bigint;
  totalCollected: bigint;
  totalSpent: bigint;
  entries?: WalletEntry[];
};

interface CorrectionForm {
  reason: string;
  correctedAmount: string;
  note: string;
}

export function ApartmentWallet() {
  const user = useAuthStore((s) => s.user);
  const { actor } = useActor(createActor);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceDisplay, setBalanceDisplay] = useState(0);
  const [correctionTarget, setCorrectionTarget] = useState<WalletEntry | null>(
    null,
  );
  const [correctionForm, setCorrectionForm] = useState<CorrectionForm>({
    reason: "",
    correctedAmount: "",
    note: "",
  });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const handleCorrection = async () => {
    if (!correctionTarget || !correctionForm.reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    if (!actor) return;
    try {
      setSubmittingCorrection(true);
      const corrAmt = correctionForm.correctedAmount
        ? BigInt(Math.round(Number(correctionForm.correctedAmount) * 100))
        : null;
      await actor.addCorrectionEntry(
        correctionTarget.id,
        correctionForm.reason.trim(),
        corrAmt ?? null,
        correctionForm.note.trim() || "",
      );
      toast.success("Correction entry added");
      setCorrectionTarget(null);
      setCorrectionForm({ reason: "", correctedAmount: "", note: "" });
      // Reload
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const result = await actor.getWalletSummaryForRole(aptId);
      setSummary(result as WalletSummary);
    } catch {
      toast.error("Failed to add correction");
    } finally {
      setSubmittingCorrection(false);
    }
  };

  useEffect(() => {
    if (!actor) return;
    const load = async () => {
      try {
        setLoading(true);
        const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
        const result = await actor.getWalletSummaryForRole(aptId);
        const ws = result as WalletSummary;
        setSummary(ws);
        // Trigger count-up
        const target = Number(ws.balance) / 100;
        const start = performance.now();
        const duration = 500;
        let _raf: number;
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setBalanceDisplay(Math.round(progress * target * 100) / 100);
          if (progress < 1) _raf = requestAnimationFrame(step);
        };
        _raf = requestAnimationFrame(step);
        // cleanup on unmount handled by component
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [actor, user?.apartmentId]);

  if (!actor)
    return (
      <Layout>
        <div
          className="p-4 bg-white min-h-screen"
          data-ocid="apartment_wallet.loading_state"
        >
          <div className="bg-gray-100 rounded-2xl h-36 animate-pulse mb-4" />
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-14 animate-pulse"
              />
            ))}
          </div>
        </div>
      </Layout>
    );

  const fmt = (n: bigint) =>
    (Number(n) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  return (
    <Layout>
      <div
        className="p-4 bg-white min-h-screen"
        data-ocid="apartment_wallet.page"
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Wallet</h1>
        <p className="text-sm text-gray-500 mb-4">Apartment fund ledger</p>

        {loading ? (
          <div data-ocid="apartment_wallet.loading_state">
            <div className="bg-gray-100 rounded-2xl h-36 animate-pulse mb-4" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-xl h-14 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Balance summary — white card with green border */}
            <div className="bg-white border border-[#22C55E] rounded-2xl p-5 mb-4 shadow-sm">
              <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-widest">
                Current Balance
              </p>
              <p className="text-gray-900 text-3xl font-bold">
                ₹
                {summary
                  ? balanceDisplay.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })
                  : "—"}
              </p>
              {summary && (
                <div className="flex gap-6 mt-3 pt-3 border-t border-[#DCFCE7]">
                  <div>
                    <p className="text-gray-400 text-xs">Total Collected</p>
                    <p className="text-[#22C55E] text-sm font-semibold">
                      ₹{fmt(summary.totalCollected)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total Spent</p>
                    <p className="text-gray-700 text-sm font-semibold">
                      ₹{fmt(summary.totalSpent)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!summary || !summary.entries || summary.entries.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-center"
                data-ocid="apartment_wallet.empty_state"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mb-4">
                  <Wallet size={28} className="text-[#22C55E]" />
                </div>
                <p className="text-base font-semibold text-gray-700 mb-1">
                  Wallet is empty.
                </p>
                <p className="text-sm text-gray-400">No transactions yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Transactions
                </p>
                {summary.entries!.map((entry, idx) => {
                  const isCredit = entry.entryType === WalletEntryType.Credit;
                  const isCorrection =
                    entry.entryType === WalletEntryType.Correction;
                  const borderColor = isCredit
                    ? "border-l-[#22C55E]"
                    : isCorrection
                      ? "border-l-blue-400"
                      : "border-l-orange-400";
                  return (
                    <div
                      key={String(entry.id)}
                      className={`bg-white rounded-xl shadow-sm border border-[#DCFCE7] border-l-4 ${borderColor} p-4 flex items-center gap-3`}
                      data-ocid={`apartment_wallet.item.${idx + 1}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-green-50" : isCorrection ? "bg-blue-50" : "bg-red-50"}`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={18} className="text-[#22C55E]" />
                        ) : isCorrection ? (
                          <FilePen size={18} className="text-blue-500" />
                        ) : (
                          <ArrowUpRight size={18} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {entry.purpose}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {entry.flatId ? `Flat ${entry.flatId} · ` : ""}
                          {new Date(
                            Number(entry.createdAt) / 1_000_000,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-sm font-bold ${isCredit ? "text-[#22C55E]" : isCorrection ? "text-blue-600" : "text-red-600"}`}
                        >
                          {isCredit ? "+" : isCorrection ? "~" : "-"}₹
                          {fmt(entry.amount)}
                        </span>
                        {!isCorrection && (
                          <button
                            type="button"
                            onClick={() => setCorrectionTarget(entry)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                            data-ocid={`apartment_wallet.correction_button.${idx + 1}`}
                          >
                            <FilePen size={11} />
                            Correct
                          </button>
                        )}
                        {isCorrection && (
                          <span className="flex items-center gap-0.5 text-xs text-blue-400">
                            <Lock size={10} />
                            Correction
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {/* Correction Modal */}
      {correctionTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="apartment_wallet.correction_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Add Correction
              </h2>
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="text-gray-400"
                data-ocid="apartment_wallet.close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
              Original entry:{" "}
              <span className="font-semibold text-gray-700">
                {correctionTarget.purpose}
              </span>{" "}
              · ₹{fmt(correctionTarget.amount)}
            </div>
            <div>
              <label
                htmlFor="corr-reason"
                className="text-xs text-gray-500 mb-1 block"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                id="corr-reason"
                placeholder="Why is this correction needed?"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={correctionForm.reason}
                onChange={(e) =>
                  setCorrectionForm({
                    ...correctionForm,
                    reason: e.target.value,
                  })
                }
                data-ocid="apartment_wallet.correction_reason_input"
              />
            </div>
            <div>
              <label
                htmlFor="corr-amount"
                className="text-xs text-gray-500 mb-1 block"
              >
                Corrected Amount (₹) — optional
              </label>
              <input
                id="corr-amount"
                type="number"
                placeholder="Leave blank if amount is correct"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={correctionForm.correctedAmount}
                onChange={(e) =>
                  setCorrectionForm({
                    ...correctionForm,
                    correctedAmount: e.target.value,
                  })
                }
                data-ocid="apartment_wallet.correction_amount_input"
              />
            </div>
            <div>
              <label
                htmlFor="corr-note"
                className="text-xs text-gray-500 mb-1 block"
              >
                Note (optional)
              </label>
              <input
                id="corr-note"
                placeholder="Additional context"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={correctionForm.note}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, note: e.target.value })
                }
                data-ocid="apartment_wallet.correction_note_input"
              />
            </div>
            <button
              type="button"
              onClick={handleCorrection}
              disabled={submittingCorrection}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              data-ocid="apartment_wallet.correction_submit_button"
            >
              {submittingCorrection ? "Adding…" : "Add Correction Entry"}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ApartmentWallet;
