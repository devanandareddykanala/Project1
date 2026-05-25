import { createActor } from "@/backend";
import type { ApartmentExpense, ExpenseCategory } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { AlertCircle, Plus, Receipt, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Salary",
  "Utilities",
  "Other",
];
const CATEGORY_ICONS: Record<string, string> = {
  Plumbing: "🔧",
  Electrical: "⚡",
  Cleaning: "🧹",
  Salary: "💰",
  Utilities: "💡",
  Other: "📦",
};

export function ExpenseTracker() {
  const user = useAuthStore((s) => s.user);
  const { actor } = useActor(createActor);
  const [expenses, setExpenses] = useState<ApartmentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!actor) return;
    try {
      setLoading(true);
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      const result = await actor.getExpenses(aptId);
      setExpenses(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within render
  useEffect(() => {
    void load();
  }, [actor, user?.apartmentId]);

  if (!actor) return <div>Loading...</div>;

  const validate = () => {
    if (!description.trim()) {
      setError("Enter a description");
      return false;
    }
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (validate()) setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const aptId = user?.apartmentId ? BigInt(String(user.apartmentId)) : 0n;
      await actor.createExpense(
        aptId,
        BigInt(Math.round(Number(amount) * 100)),
        category as unknown as ExpenseCategory,
        description.trim(),
        "",
      );
      toast.success("Expense recorded");
      setShowConfirm(false);
      setShowForm(false);
      setDescription("");
      setAmount("");
      setCategory("Plumbing");
      setDate(new Date().toISOString().split("T")[0]);
      await load();
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0) / 100;

  return (
    <Layout>
      <div
        className="p-4 bg-white min-h-screen"
        data-ocid="expense_tracker.page"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Apartment expense records
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors"
            data-ocid="expense_tracker.open_modal_button"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {expenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 mb-4">
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-md p-5"
              data-ocid="expense_tracker.dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Add Expense</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  data-ocid="expense_tracker.close_button"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="expense-description"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Description
                  </label>
                  <input
                    id="expense-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Monthly cleaning"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="expense_tracker.input"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor="expense-amount"
                      className="text-xs font-medium text-gray-600 mb-1 block"
                    >
                      Amount (₹)
                    </label>
                    <input
                      id="expense-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                      data-ocid="expense_tracker.amount_input"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="expense-date"
                      className="text-xs font-medium text-gray-600 mb-1 block"
                    >
                      Date
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                      data-ocid="expense_tracker.date_input"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="expense-category"
                    className="text-xs font-medium text-gray-600 mb-1 block"
                  >
                    Category
                  </label>
                  <select
                    id="expense-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-sm"
                    data-ocid="expense_tracker.select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_ICONS[c]} {c}
                      </option>
                    ))}
                  </select>
                </div>
                {error && (
                  <p
                    className="text-red-500 text-xs flex items-center gap-1"
                    data-ocid="expense_tracker.error_state"
                  >
                    <AlertCircle size={12} />
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
                    data-ocid="expense_tracker.cancel_button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm"
                    data-ocid="expense_tracker.submit_button"
                  >
                    Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-lg w-full max-w-sm p-5"
              data-ocid="expense_tracker.confirm_dialog"
            >
              <h2 className="font-bold text-gray-900 mb-2">Confirm Expense</h2>
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-gray-700">{description}</p>
                <p className="text-gray-500 mt-1">
                  {CATEGORY_ICONS[category]} {category} · {date}
                </p>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  ₹
                  {Number(amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                This will be deducted from the apartment wallet. Cannot be
                undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 border border-[#DCFCE7] text-gray-700 font-semibold rounded-lg py-2 text-sm"
                  data-ocid="expense_tracker.confirm_cancel_button"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-60"
                  data-ocid="expense_tracker.confirm_button"
                >
                  {submitting ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div
            className="flex flex-col gap-3"
            data-ocid="expense_tracker.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-16 animate-pulse"
              />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16"
            data-ocid="expense_tracker.empty_state"
          >
            <Receipt size={40} className="text-gray-300" />
            <p className="text-sm text-gray-400 text-center">
              No expenses recorded yet.
              <br />
              Tap Add to log one.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expenses.map((exp, idx) => (
              <div
                key={String(exp.id)}
                className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4"
                data-ocid={`expense_tracker.item.${idx + 1}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {CATEGORY_ICONS[exp.category as unknown as string] ??
                          "📦"}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {exp.description}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {exp.category as unknown as string} ·{" "}
                      {new Date(
                        Number(exp.createdAt) / 1_000_000,
                      ).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-600 ml-2">
                    -₹
                    {(Number(exp.amount) / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ExpenseTracker;
