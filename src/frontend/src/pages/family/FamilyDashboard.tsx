import { PaymentStatus, TaskStatus, createActor } from "@/backend";
import type { MaintenancePayment } from "@/backend";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  IndianRupee,
  ListTodo,
  ShoppingCart,
} from "lucide-react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatMonthYear(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

const QUICK_ACTIONS = [
  {
    label: "Add Task",
    icon: ListTodo,
    href: "/family/tasks",
    ocid: "add_task",
  },
  {
    label: "Add Expense",
    icon: IndianRupee,
    href: "/family/expenses",
    ocid: "add_expense",
  },
  {
    label: "Add to Grocery",
    icon: ShoppingCart,
    href: "/family/grocery",
    ocid: "add_grocery",
  },
  {
    label: "View Calendar",
    icon: CalendarDays,
    href: "/family/calendar",
    ocid: "view_calendar",
  },
] as const;

export function FamilyDashboard() {
  const { actor, isFetching } = useActor(createActor);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: payments = [] } = useQuery<MaintenancePayment[]>({
    queryKey: ["maintenancePayments"],
    queryFn: async () => (actor ? actor.getMyMaintenancePayments() : []),
    enabled: !!actor && !isFetching,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["familyTasks"],
    queryFn: async () => (actor ? actor.listFamilyTasks() : []),
    enabled: !!actor && !isFetching,
  });

  const { data: groceryItems = [] } = useQuery({
    queryKey: ["groceryItems"],
    queryFn: async () => (actor ? actor.listGroceryItems() : []),
    enabled: !!actor && !isFetching,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["familyExpenses"],
    queryFn: async () => (actor ? actor.listFamilyExpenses() : []),
    enabled: !!actor && !isFetching,
  });

  const firstName = user?.name ? user.name.split(" ")[0] : "";

  const pendingTasksCount = (tasks as Array<{ status: TaskStatus }>).filter(
    (t) => t.status !== TaskStatus.Done,
  ).length;

  const toBuyCount = (groceryItems as Array<{ isPurchased: boolean }>).filter(
    (g) => !g.isPurchased,
  ).length;

  const startOfMonth =
    BigInt(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(),
    ) * 1_000_000n;
  const now = BigInt(Date.now()) * 1_000_000n;
  const monthTotal = (expenses as Array<{ amount: bigint; createdAt: bigint }>)
    .filter((e) => e.createdAt >= startOfMonth && e.createdAt <= now)
    .reduce((sum, e) => sum + e.amount, 0n);

  // Recent activity — last 5 across tasks + expenses + grocery
  const recentActivity = [
    ...(tasks as Array<{ title?: string; createdAt?: bigint }>)
      .slice(0, 3)
      .map((t) => ({
        label: t.title ?? "Task",
        sub: "Task added",
        ts: t.createdAt ?? 0n,
      })),
    ...(
      expenses as Array<{
        description?: string;
        amount?: bigint;
        createdAt?: bigint;
      }>
    )
      .slice(0, 3)
      .map((e) => ({
        label: e.description ?? "Expense",
        sub: `₹${(e.amount ?? 0n).toString()} expense`,
        ts: e.createdAt ?? 0n,
      })),
    ...(groceryItems as Array<{ name?: string; createdAt?: bigint }>)
      .slice(0, 3)
      .map((g) => ({
        label: g.name ?? "Grocery item",
        sub: "Added to grocery",
        ts: g.createdAt ?? 0n,
      })),
  ]
    .sort((a, b) => (b.ts > a.ts ? 1 : -1))
    .slice(0, 5);

  // Apartment snapshot — latest payment
  const latestPayment = payments[0];
  const isPaid =
    latestPayment && latestPayment.status === PaymentStatus.Verified;

  return (
    <Layout>
      <div
        className="min-h-screen bg-white pb-24"
        data-ocid="family_dashboard.page"
      >
        {/* Greeting */}
        <div className="px-4 pt-6 pb-4">
          <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">
            Family Mode
          </p>
          <h1 className="text-2xl font-bold text-[#111827]">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        </div>

        {/* 3 Stat Cards */}
        <div className="px-4 grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/family/tasks" })}
            data-ocid="family_dashboard.stat.pending_tasks"
            className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-3 flex flex-col items-center gap-1 hover:border-[#22C55E] transition-colors"
          >
            <ListTodo size={18} className="text-[#22C55E]" />
            <span className="text-xl font-bold text-[#111827]">
              {pendingTasksCount}
            </span>
            <span className="text-xs text-[#6b7280] text-center leading-tight">
              Pending Tasks
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/family/grocery" })}
            data-ocid="family_dashboard.stat.to_buy"
            className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-3 flex flex-col items-center gap-1 hover:border-[#22C55E] transition-colors"
          >
            <ShoppingCart size={18} className="text-[#22C55E]" />
            <span className="text-xl font-bold text-[#111827]">
              {toBuyCount}
            </span>
            <span className="text-xs text-[#6b7280] text-center leading-tight">
              To Buy
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/family/expenses" })}
            data-ocid="family_dashboard.stat.this_month"
            className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-3 flex flex-col items-center gap-1 hover:border-[#22C55E] transition-colors"
          >
            <IndianRupee size={18} className="text-[#22C55E]" />
            <span className="text-xl font-bold text-[#111827]">
              ₹{monthTotal.toString()}
            </span>
            <span className="text-xs text-[#6b7280] text-center leading-tight">
              This Month
            </span>
          </button>
        </div>

        {/* Apartment Snapshot — always render */}
        <div className="px-4 mb-6">
          <div
            className="bg-white rounded-xl border border-[#DCFCE7] p-4 flex items-center justify-between"
            style={{ borderLeft: "4px solid #22C55E" }}
            data-ocid="family_dashboard.apartment_snapshot"
          >
            {latestPayment ? (
              <>
                <div>
                  <p className="text-xs text-[#6b7280] mb-0.5">Maintenance</p>
                  <p className="text-sm font-medium text-[#111827]">
                    {formatMonthYear(latestPayment.createdAt)}
                  </p>
                </div>
                {isPaid ? (
                  <span className="text-xs bg-[#DCFCE7] text-[#16A34A] px-2.5 py-1 rounded-full font-semibold">
                    Paid ✓
                  </span>
                ) : (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                    Pending ₹{latestPayment.amount.toString()}
                  </span>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-[#6b7280] mb-0.5">Maintenance</p>
                  <p className="text-sm font-medium text-[#111827]">
                    No records yet
                  </p>
                </div>
                <span className="text-xs text-[#6b7280] px-2.5 py-1 rounded-full border border-[#DCFCE7]">
                  —
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions 2×2 */}
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, href, ocid }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate({ to: href })}
                data-ocid={`family_dashboard.quick_action.${ocid}`}
                className="bg-white rounded-xl border border-[#DCFCE7] shadow-sm p-4 flex flex-col items-center gap-2 hover:border-[#22C55E] transition-colors"
              >
                <Icon size={22} color="#22C55E" />
                <span className="text-xs font-medium text-[#111827] text-center">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div
              className="bg-white rounded-xl border border-[#DCFCE7] p-8 flex flex-col items-center gap-3"
              data-ocid="family_dashboard.activity.empty_state"
            >
              <CalendarDays size={32} className="text-[#DCFCE7]" />
              <p className="text-sm text-[#6b7280] text-center">
                Your family activity will appear here
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: "/family/tasks" })}
                data-ocid="family_dashboard.activity.add_task_button"
                className="text-sm text-[#22C55E] font-semibold hover:underline"
              >
                Add your first task →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentActivity.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="bg-white rounded-xl border border-[#DCFCE7] px-4 py-3 flex items-center gap-3"
                  data-ocid={`family_dashboard.activity.item.${idx + 1}`}
                >
                  <div className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#6b7280]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <FeedbackButton />
      </div>
    </Layout>
  );
}
