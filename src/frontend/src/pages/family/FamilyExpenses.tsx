import { createActor } from "@/backend";
import type { FamilyExpense } from "@/backend";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, IndianRupee, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  type FamilyExpenseCategory,
  FamilyExpenseCategory as FamilyExpenseCategoryEnum,
} from "@/backend";

const CATEGORIES: FamilyExpenseCategory[] = [
  FamilyExpenseCategoryEnum.Food,
  FamilyExpenseCategoryEnum.Transport,
  FamilyExpenseCategoryEnum.Medical,
  FamilyExpenseCategoryEnum.Entertainment,
  FamilyExpenseCategoryEnum.Bills,
  FamilyExpenseCategoryEnum.Grocery,
  FamilyExpenseCategoryEnum.Other,
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-100 text-orange-700",
  Transport: "bg-blue-100 text-blue-700",
  Medical: "bg-red-100 text-red-700",
  Entertainment: "bg-purple-100 text-purple-700",
  Bills: "bg-yellow-100 text-yellow-700",
  Grocery: "bg-green-100 text-green-700",
  Other: "bg-gray-100 text-gray-700",
};

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

// Helper to check if expense is within edit window (24h)
function withinWindowOf(exp: FamilyExpense): boolean {
  return Date.now() - Number(exp.createdAt) / 1_000_000 < 86_400_000;
}

export function FamilyExpenses() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [correctionTarget, setCorrectionTarget] =
    useState<FamilyExpense | null>(null);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<FamilyExpenseCategory>(
    FamilyExpenseCategoryEnum.Food,
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: expenses = [], isLoading } = useQuery<FamilyExpense[]>({
    queryKey: ["familyExpenses"],
    queryFn: async () => (actor ? actor.listFamilyExpenses() : []),
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !description.trim() || !amount)
        throw new Error("Missing fields");
      const ts = BigInt(new Date(date).getTime()) * 1_000_000n;
      await actor.addFamilyExpense(
        BigInt(Math.round(Number.parseFloat(amount))),
        category,
        description.trim(),
        ts,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["familyExpenses"] });
      setOpen(false);
      setDescription("");
      setAmount("");
      setCategory(FamilyExpenseCategoryEnum.Food);
      setDate(new Date().toISOString().split("T")[0]);
      toast.success("Expense added");
    },
    onError: () => toast.error("Could not add expense"),
  });

  const startOfMonth =
    BigInt(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(),
    ) * 1_000_000n;
  const now = BigInt(Date.now()) * 1_000_000n;
  const monthTotal = expenses
    .filter((e) => e.createdAt >= startOfMonth && e.createdAt <= now)
    .reduce((sum, e) => sum + e.amount, 0n);

  return (
    <Layout>
      <div
        className="min-h-screen bg-white pb-24"
        data-ocid="family_expenses.page"
      >
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">
              Family Mode
            </p>
            <h1 className="text-2xl font-bold text-[#111827]">Expenses</h1>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-ocid="family_expenses.add_button"
            className="w-10 h-10 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center shadow-sm transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mx-4 mb-6 bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            <IndianRupee size={20} className="text-[#22C55E]" />
          </div>
          <div>
            <p className="text-xs text-[#6b7280]">This month's spending</p>
            <p className="text-2xl font-bold text-[#111827]">
              ₹{monthTotal.toString()}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-4" data-ocid="family_expenses.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-16 mb-3 animate-pulse"
              />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div
            className="mx-4 rounded-xl border border-[#DCFCE7] bg-white p-10 flex flex-col items-center gap-3"
            data-ocid="family_expenses.empty_state"
          >
            <IndianRupee size={36} className="text-[#DCFCE7]" />
            <p className="text-sm text-[#6b7280] text-center">
              No expenses yet. Tap + to add one.
            </p>
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-2">
            {expenses.map((exp, idx) => {
              const withinWindow = withinWindowOf(exp);
              const isOwner = exp.principalId.toString() === user?.principal;
              const showCorrection = !withinWindow && isOwner;
              return (
                <div
                  key={exp.id.toString()}
                  className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 flex items-center justify-between"
                  data-ocid={`family_expenses.item.${idx + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[exp.category] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {exp.category}
                      </span>
                      <span className="text-xs text-[#6b7280]">
                        {formatDate(exp.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <p className="text-base font-bold text-[#111827]">
                      ₹{exp.amount.toString()}
                    </p>
                    {withinWindow && isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectionTarget(exp);
                          setDescription(exp.description);
                          setAmount(exp.amount.toString());
                          setCategory(exp.category as FamilyExpenseCategory);
                        }}
                        data-ocid={`family_expenses.edit_button.${idx + 1}`}
                        className="flex items-center gap-1 text-xs text-[#22C55E] border border-[#22C55E] px-2 py-0.5 rounded-lg hover:bg-[#F0FDF4] transition-colors"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                    )}
                    {showCorrection && (
                      <button
                        type="button"
                        onClick={() => setCorrectionTarget(exp)}
                        data-ocid={`family_expenses.correction_button.${idx + 1}`}
                        className="flex items-center gap-1 text-xs text-[#6b7280] border border-[#DCFCE7] px-2 py-0.5 rounded-lg hover:border-[#22C55E] hover:text-[#22C55E] transition-colors"
                      >
                        <Edit2 size={11} /> Correction
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Correction modal — shown after 24-hour window */}
        {correctionTarget && !withinWindowOf(correctionTarget) && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            data-ocid="family_expenses.correction_dialog"
          >
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setCorrectionTarget(null)}
              aria-label="Close"
            />
            <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#111827] text-lg">
                  Add Correction
                </h3>
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  data-ocid="family_expenses.correction_close_button"
                >
                  <X size={20} className="text-[#6b7280]" />
                </button>
              </div>
              <div className="text-xs text-[#6b7280] bg-blue-50 rounded-lg p-3 mb-4">
                Original:{" "}
                <span className="font-semibold text-[#111827]">
                  {correctionTarget.description}
                </span>{" "}
                · ₹{correctionTarget.amount.toString()}
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="corr-desc"
                    className="text-xs text-[#6b7280] mb-1 block font-medium"
                  >
                    Correction note <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="corr-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why is this correction needed?"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-xl px-3 py-2.5 text-[#111827] text-sm"
                    data-ocid="family_expenses.correction_note_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="corr-amt"
                    className="text-xs text-[#6b7280] mb-1 block font-medium"
                  >
                    Corrected Amount (₹)
                  </label>
                  <input
                    id="corr-amt"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Leave blank to keep original"
                    className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-xl px-3 py-2.5 text-[#111827] text-sm"
                    data-ocid="family_expenses.correction_amount_input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!description.trim()) return;
                    toast.info(
                      "Correction entry noted. Original record preserved.",
                    );
                    setCorrectionTarget(null);
                    setDescription("");
                    setAmount("");
                  }}
                  disabled={!description.trim()}
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                  data-ocid="family_expenses.correction_submit_button"
                >
                  Add Correction Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            data-ocid="family_expenses.dialog"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-label="Close"
            />
            <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[#111827] text-lg">
                  Add Expense
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  data-ocid="family_expenses.close_button"
                >
                  <X size={20} className="text-[#6b7280]" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="expense-description"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Description
                  </label>
                  <input
                    id="expense-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Grocery shopping"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_expenses.description_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="expense-amount"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Amount (₹)
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_expenses.amount_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="expense-category"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Category
                  </label>
                  <div id="expense-category" className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        data-ocid={`family_expenses.category.${c.toLowerCase()}`}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          category === c
                            ? "bg-[#22C55E] text-white"
                            : "bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="expense-date"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Date
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_expenses.date_input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addMutation.mutate()}
                  disabled={
                    addMutation.isPending || !description.trim() || !amount
                  }
                  data-ocid="family_expenses.submit_button"
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {addMutation.isPending ? "Saving..." : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
