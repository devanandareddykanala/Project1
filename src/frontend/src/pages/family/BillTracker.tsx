import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import type { Bill } from "@/types";
import { CheckCircle2, Circle, Plus, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";

const CATEGORIES: Bill["category"][] = [
  "electricity",
  "water",
  "gas",
  "internet",
  "ott",
  "insurance",
  "rent",
  "other",
];

const CAT_LABELS: Record<Bill["category"], string> = {
  electricity: "Electricity",
  water: "Water",
  gas: "Gas",
  internet: "Internet",
  ott: "OTT / Streaming",
  insurance: "Insurance",
  rent: "Rent",
  other: "Other",
};

const billToday = new Date();
const currentDay = billToday.getDate();

export function BillTracker() {
  const { user: _user } = useAuthStore();
  const [bills, setBills] = useState<Bill[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [category, setCategory] = useState<Bill["category"]>("electricity");
  const [showForm, setShowForm] = useState(false);

  const total = bills
    .filter((b) => b.isActive)
    .reduce((s, b) => s + b.amount, 0);
  const unpaid = bills.filter((b) => !b.isPaid && b.isActive);
  const dueThisWeek = unpaid.filter((b) => {
    const diff = b.dueDay - currentDay;
    return diff >= 0 && diff <= 7;
  });

  const add = () => {
    if (!name.trim() || !amount) return;
    const bill: Bill = {
      id: String(Date.now()),
      name: name.trim(),
      amount: Number(amount),
      dueDay: Number(dueDay),
      category,
      isPaid: false,
      isActive: true,
      createdAt: Date.now(),
    };
    setBills((p) => [...p, bill]);
    setName("");
    setAmount("");
    setShowForm(false);
  };

  const togglePaid = (id: string) =>
    setBills((p) =>
      p.map((b) => (b.id === id ? { ...b, isPaid: !b.isPaid } : b)),
    );

  const remove = (id: string) => setBills((p) => p.filter((b) => b.id !== id));

  return (
    <Layout>
      <div className="p-4 space-y-4" data-ocid="bill_tracker.page">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">
              Bill Tracker
            </h1>
            <p className="text-xs text-primary font-mono">
              Monthly total: \u20b9{total.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((p) => !p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            data-ocid="bill_tracker.add_button"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Due this week alert */}
        {dueThisWeek.length > 0 && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3">
            <p className="text-xs font-semibold mb-2 text-yellow-400 font-mono">
              DUE THIS WEEK ({dueThisWeek.length})
            </p>
            {dueThisWeek.map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <p className="text-sm text-foreground">{b.name}</p>
                <p className="text-sm font-bold text-yellow-400">
                  \u20b9{b.amount.toLocaleString("en-IN")} · {b.dueDay}th
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Bill name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="bill_tracker.name_input"
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
                placeholder="Amount (\u20b9)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-ocid="bill_tracker.amount_input"
              />
              <input
                className="w-20 rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
                placeholder="Due day"
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                data-ocid="bill_tracker.due_day_input"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`bill_tracker.cat_${c}`}
                >
                  {CAT_LABELS[c]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={add}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              data-ocid="bill_tracker.submit_button"
            >
              Add Bill
            </button>
          </div>
        )}

        {/* Bills list */}
        <div className="space-y-2" data-ocid="bill_tracker.list">
          {bills.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-card/50"
              data-ocid="bill_tracker.empty_state"
            >
              <Receipt size={36} className="text-primary/40 mb-3" />
              <p className="text-sm font-body font-medium text-foreground">
                No bills tracked yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Add recurring bills to stay on top of due dates
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-lg text-xs font-mono bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Add first bill
              </button>
            </div>
          )}
          {bills.map((bill, i) => (
            <div
              key={bill.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
              data-ocid={`bill_tracker.item.${i + 1}`}
            >
              <button
                type="button"
                onClick={() => togglePaid(bill.id)}
                data-ocid={`bill_tracker.checkbox.${i + 1}`}
              >
                {bill.isPaid ? (
                  <CheckCircle2 size={20} className="text-primary" />
                ) : (
                  <Circle size={20} className="text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-body ${bill.isPaid ? "text-muted-foreground line-through" : "text-foreground"}`}
                >
                  {bill.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {CAT_LABELS[bill.category]} · Due: {bill.dueDay}th
                </p>
              </div>
              <p
                className={`text-sm font-bold ${bill.isPaid ? "text-muted-foreground" : "text-primary"}`}
              >
                \u20b9{bill.amount.toLocaleString("en-IN")}
              </p>
              <button
                type="button"
                onClick={() => remove(bill.id)}
                data-ocid={`bill_tracker.delete_button.${i + 1}`}
              >
                <Trash2
                  size={14}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
