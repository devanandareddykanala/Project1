import { createActor } from "@/backend";
import type { MaintenancePayment, PaymentStatus } from "@/backend";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, FilePen, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "Verified")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-semibold">
        Verified
      </span>
    );
  if (status === "Rejected")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">
        Rejected
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold border border-orange-200">
      Pending
    </span>
  );
}

interface PayForm {
  amount: string;
  month: string;
  year: string;
  utr: string;
  screenshotUrl: string;
  screenshotName: string;
}
function defaultForm(): PayForm {
  const now = new Date();
  return {
    amount: "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    utr: "",
    screenshotUrl: "",
    screenshotName: "",
  };
}

export function MaintenanceTracker() {
  const { user } = useAuthStore();
  const isSA = user?.role === "super_admin";
  const canSubmit = user?.role === "flat_admin" || user?.role === "super_admin";
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [form, setForm] = useState<PayForm>(defaultForm);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Pending" | "Verified" | "Rejected"
  >("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_correctionTarget, setCorrectionTarget] =
    useState<MaintenancePayment | null>(null);
  const defaultCorrectionForm = () => ({ reason: "", amount: "", note: "" });
  const [_correctionForm, setCorrectionForm] = useState(defaultCorrectionForm);
  const [syncedAt] = useState<Date>(new Date());
  const [collectedDisplay, setCollectedDisplay] = useState(0);

  const {
    data: payments = [],
    isLoading,
    isError,
  } = useQuery<MaintenancePayment[]>({
    queryKey: isSA
      ? ["pendingPayments", user?.apartmentId]
      : ["myPayments", user?.flatId],
    queryFn: async () => {
      if (!actor) return [];
      if (isSA && user?.apartmentId)
        return actor.getPendingPayments(BigInt(user.apartmentId));
      if (user?.flatId) return actor.getPaymentsByFlat(BigInt(user.flatId));
      return [];
    },
    enabled: !!actor && !actorFetching && !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !user?.flatId || !user?.apartmentId)
        throw new Error("Not authenticated");
      const amt = Number(form.amount);
      if (!amt || amt <= 0) throw new Error("Enter a valid amount");
      if (!form.utr.trim()) throw new Error("UTR number is required");
      const result = await actor.submitPayment(
        BigInt(user.flatId),
        BigInt(user.apartmentId),
        BigInt(amt),
        BigInt(form.month),
        BigInt(form.year),
        form.utr.trim(),
        form.screenshotUrl,
      );
      if ("err" in result) throw new Error(String(result.err));
    },
    onSuccess: () => {
      toast.success("Payment submitted for verification");
      setShowForm(false);
      setForm(defaultForm());
      qc.invalidateQueries({ queryKey: ["myPayments"] });
      qc.invalidateQueries({ queryKey: ["pendingPayments"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({
      paymentId,
      approve,
    }: { paymentId: bigint; approve: boolean }) => {
      if (!actor) throw new Error("Not authenticated");
      const result = await actor.verifyPayment(paymentId, approve);
      if ("err" in result) throw new Error(String(result.err));
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? "Payment verified" : "Payment rejected");
      qc.invalidateQueries({ queryKey: ["pendingPayments"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Screenshot must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result;
      if (typeof url === "string")
        setForm((p) => ({
          ...p,
          screenshotUrl: url,
          screenshotName: file.name,
        }));
    };
    reader.readAsDataURL(file);
  }

  const collected = payments
    .filter((p) => p.status === "Verified")
    .reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount = payments.filter((p) => p.status === "Pending").length;

  // Count-up animation for collected amount
  useEffect(() => {
    if (!collected) {
      setCollectedDisplay(0);
      return;
    }
    const start = performance.now();
    const duration = 500;
    let raf: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCollectedDisplay(Math.round(progress * collected));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [collected]);

  function fmtSync(d: Date) {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 10) return "just now";
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  }
  const filtered =
    filterStatus === "all"
      ? payments
      : payments.filter((p) => p.status === filterStatus);

  function fmtMonth(month: bigint, year: bigint) {
    const m = Number(month);
    const y = Number(year);
    if (m < 1 || m > 12) return `${y}`;
    return new Date(y, m - 1, 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white" data-ocid="maintenance.page">
        <div className="p-4 pb-24">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Payments</h1>
          <p className="text-sm text-gray-500 mb-4">
            Maintenance tracker &amp; collections
          </p>

          {isLoading && (
            <div data-ocid="maintenance.loading_state">
              {/* Skeleton shimmer rows */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-xl h-16 animate-pulse"
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-xl h-16 animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}
          {isError && (
            <div
              className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 text-sm text-red-600"
              data-ocid="maintenance.error_state"
            >
              Something went wrong. Please try again.
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-3">
                  <p className="text-xs text-gray-500 mb-1">Collected</p>
                  <p className="text-base font-bold text-[#22C55E]">
                    ₹{collectedDisplay.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-3">
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="text-base font-bold text-gray-900">
                    {payments.length}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-3">
                  <p className="text-xs text-gray-500 mb-1">Pending</p>
                  <p className="text-base font-bold text-orange-500">
                    {pendingCount}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                {canSubmit && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors"
                    data-ocid="maintenance.submit_payment_button"
                  >
                    + Submit Payment
                  </button>
                )}
                {isSA && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setVerifyMode(!verifyMode)}
                    className="flex-1 bg-white border border-[#DCFCE7] text-gray-700 font-semibold py-3 rounded-lg hover:border-[#22C55E] transition-colors"
                    data-ocid="maintenance.verify_mode_button"
                  >
                    Verify ({pendingCount})
                  </button>
                )}
              </div>

              {/* Sync status */}
              <div className="flex items-center gap-1.5 mb-3">
                <RefreshCw size={11} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  Last synced: {fmtSync(syncedAt)}
                </span>
              </div>

              {/* Filter tabs */}
              <div
                className="flex gap-2 mb-4"
                data-ocid="maintenance.filter_tabs"
              >
                {(["all", "Pending", "Verified", "Rejected"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        filterStatus === s
                          ? "bg-[#22C55E] text-white"
                          : "bg-white border border-[#DCFCE7] text-gray-600 hover:border-[#22C55E]"
                      }`}
                      data-ocid={`maintenance.filter.${s.toLowerCase()}`}
                    >
                      {s === "all" ? "All" : s}
                    </button>
                  ),
                )}
              </div>

              {/* Pending verification panel */}
              {verifyMode && isSA && (
                <div
                  className="bg-white rounded-xl border border-[#DCFCE7] mb-4 overflow-hidden"
                  data-ocid="maintenance.verify_list"
                >
                  <div className="px-4 py-3 border-b border-[#DCFCE7] bg-[#f0fdf4]">
                    <p className="text-sm font-semibold text-gray-700">
                      Payments Awaiting Verification
                    </p>
                  </div>
                  {payments
                    .filter((p) => p.status === "Pending")
                    .map((p) => (
                      <div
                        key={String(p.id)}
                        className="px-4 py-3 border-b border-[#DCFCE7] last:border-0 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            Flat #{String(p.flatId)}
                          </p>
                          <p className="text-xs text-gray-500">
                            UTR: {p.utrNumber || "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {fmtMonth(p.month, p.year)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[#22C55E]">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              verifyMutation.mutate({
                                paymentId: p.id,
                                approve: true,
                              })
                            }
                            disabled={verifyMutation.isPending}
                            className="p-2 rounded-lg bg-[#dcfce7] text-[#16a34a] hover:bg-[#bbf7d0] transition-colors disabled:opacity-50"
                            data-ocid="maintenance.verify_approve_button"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              verifyMutation.mutate({
                                paymentId: p.id,
                                approve: false,
                              })
                            }
                            disabled={verifyMutation.isPending}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                            data-ocid="maintenance.verify_reject_button"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* List */}
              {filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  data-ocid="maintenance.empty_state"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mb-4">
                    <CreditCard size={28} className="text-[#22C55E]" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">
                    No maintenance records yet.
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    All tenants are paid up!
                  </p>
                  {canSubmit && (
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors"
                      data-ocid="maintenance.empty_submit_button"
                    >
                      Submit Payment
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="flex flex-col gap-2"
                  data-ocid="maintenance.payment_list"
                >
                  {filtered.map((p, i) => (
                    <div
                      key={String(p.id)}
                      className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 flex items-center gap-3"
                      data-ocid={`maintenance.item.${i + 1}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#f0fdf4] flex items-center justify-center text-xs font-bold text-[#22C55E]">
                        F{String(p.flatId)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {fmtMonth(p.month, p.year)}
                        </p>
                        {p.utrNumber && (
                          <p className="text-xs text-gray-500 truncate">
                            UTR: {p.utrNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </p>
                        <StatusBadge status={p.status} />
                        {isSA && p.status === "Verified" && (
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectionTarget(p);
                              setCorrectionForm(defaultCorrectionForm());
                            }}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#16A34A] transition-colors mt-1"
                            data-ocid={`maintenance.correction_button.${i + 1}`}
                          >
                            <FilePen size={12} />
                            Correction
                          </button>
                        )}
                        {isSA &&
                          p.status === "Pending" &&
                          Number(p.amount) > 2000 && (
                            <span className="flex items-center gap-0.5 text-xs text-orange-500 mt-1">
                              ⚠ 2-admin approval
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit Payment Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="maintenance.submit_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Submit Payment
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
                data-ocid="maintenance.close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label
                htmlFor="pay-amount"
                className="text-xs text-gray-500 mb-1 block"
              >
                Amount (₹)
              </label>
              <input
                id="pay-amount"
                type="number"
                placeholder="e.g. 2500"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                data-ocid="maintenance.amount_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="pay-month"
                  className="text-xs text-gray-500 mb-1 block"
                >
                  Month
                </label>
                <select
                  id="pay-month"
                  className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  data-ocid="maintenance.month_select"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable month list
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i, 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="pay-year"
                  className="text-xs text-gray-500 mb-1 block"
                >
                  Year
                </label>
                <input
                  id="pay-year"
                  type="number"
                  placeholder="2025"
                  className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  data-ocid="maintenance.year_input"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="pay-utr"
                className="text-xs text-gray-500 mb-1 block"
              >
                UTR / Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                id="pay-utr"
                placeholder="12-digit UTR from your UPI app"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={form.utr}
                onChange={(e) => setForm({ ...form, utr: e.target.value })}
                data-ocid="maintenance.utr_input"
              />
            </div>
            <div>
              <label
                htmlFor="pay-screenshot"
                className="text-xs text-gray-500 mb-1 block"
              >
                Payment Screenshot (optional)
              </label>
              <input
                id="pay-screenshot"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshot}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-[#DCFCE7] hover:border-[#22C55E] rounded-lg px-3 py-3 text-sm text-gray-500 hover:text-[#22C55E] transition-colors"
                data-ocid="maintenance.screenshot_upload_button"
              >
                {form.screenshotName
                  ? `✓ ${form.screenshotName}`
                  : "Tap to upload screenshot"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              data-ocid="maintenance.submit_button"
            >
              {submitMutation.isPending ? "Submitting…" : "Submit Payment"}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
