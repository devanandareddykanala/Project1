import { createActor } from "@/backend";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  ParkingSquare,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  balance: number;
  totalCollected: number;
  totalSpent: number;
  flatsCount: number;
  openIssuesCount: number;
  pendingPaymentsCount: number;
}

const QUICK_ACTIONS = [
  {
    label: "Payments",
    icon: CreditCard,
    to: "/apartment/maintenance",
    ocid: "dashboard.payments_link",
  },
  {
    label: "Visitors",
    icon: ShieldCheck,
    to: "/apartment/visitors",
    ocid: "dashboard.visitors_link",
  },
  {
    label: "Notices",
    icon: MessageSquare,
    to: "/apartment/notices",
    ocid: "dashboard.notices_link",
  },
  {
    label: "Documents",
    icon: FileText,
    to: "/apartment/documents",
    ocid: "dashboard.documents_link",
  },
  {
    label: "Issues",
    icon: Wrench,
    to: "/apartment/issues",
    ocid: "dashboard.issues_link",
  },
  {
    label: "Parking",
    icon: ParkingSquare,
    to: "/apartment/parking",
    ocid: "dashboard.parking_link",
  },
];

export function ApartmentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!actor || isFetching || !user?.apartmentId) {
      setLoading(false);
      return;
    }
    const apId = BigInt(user.apartmentId);
    setLoading(true);
    setError(null);
    Promise.all([
      actor.getFlats(apId).catch(() => [] as unknown[]),
      actor.getIssues(apId).catch(() => [] as unknown[]),
      actor.getPendingPayments(apId).catch(() => [] as unknown[]),
      actor.getWalletBalance(apId).catch(() => BigInt(0)),
    ])
      .then(([flats, issues, pending, balance]) => {
        const openIssues = (issues as Array<{ status: string }>).filter(
          (i) => i.status === "Open",
        );
        setStats({
          balance: Number(balance as bigint) / 100,
          totalCollected: 0,
          totalSpent: 0,
          flatsCount: (flats as unknown[]).length,
          openIssuesCount: openIssues.length,
          pendingPaymentsCount: (pending as unknown[]).length,
        });
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [actor, isFetching, user?.apartmentId]);

  const fmtINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const STAT_CARDS = [
    {
      label: "Pending Pay",
      value: stats?.pendingPaymentsCount ?? 0,
      icon: CreditCard,
      to: "/apartment/maintenance" as const,
      ocid: "dashboard.pending_pay_card",
    },
    {
      label: "Open Issues",
      value: stats?.openIssuesCount ?? 0,
      icon: Wrench,
      to: "/apartment/issues" as const,
      ocid: "dashboard.open_issues_card",
    },
    {
      label: "Wallet Balance",
      value: fmtINR(stats?.balance ?? 0),
      icon: Wallet,
      to: "/apartment/wallet" as const,
      ocid: "dashboard.wallet_card",
    },
    {
      label: "Flats",
      value: stats?.flatsCount ?? 0,
      icon: Users,
      to: null,
      ocid: "dashboard.flats_card",
    },
  ];

  return (
    <Layout>
      <div
        className="min-h-screen bg-white"
        data-ocid="apartment_dashboard.page"
      >
        <div className="p-4 pb-24">
          {/* Greeting */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {user?.name?.split(" ")[0] ?? "Admin"}
            </h1>
            {user?.apartmentName !== undefined ? (
              <p className="text-xs text-gray-400 mt-0.5">
                {user.apartmentName}
              </p>
            ) : user?.apartmentId !== undefined ? (
              <p className="text-xs text-gray-400 mt-0.5">My Apartment</p>
            ) : null}
          </div>

          {/* Loading */}
          {loading && (
            <div
              className="flex items-center gap-2 py-6 justify-center"
              data-ocid="dashboard.loading_state"
            >
              <Loader2 size={18} className="animate-spin text-[#22C55E]" />
              <span className="text-sm text-gray-500">Loading dashboard…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 text-sm text-red-600"
              data-ocid="dashboard.error_state"
            >
              {error}
            </div>
          )}

          {/* 4 Stat Cards — 2×2 grid */}
          {!loading && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon;
                const isClickable = card.to !== null;
                const Tag = isClickable ? "button" : "div";
                return (
                  <Tag
                    key={card.label}
                    {...(isClickable
                      ? {
                          type: "button" as const,
                          onClick: () => card.to && navigate({ to: card.to }),
                        }
                      : {})}
                    className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 text-left ${
                      isClickable
                        ? "hover:border-[#22C55E] hover:shadow-md transition-all active:scale-98 cursor-pointer"
                        : ""
                    }`}
                    data-ocid={card.ocid}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                      <Icon size={20} className="text-[#22C55E]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">
                      {typeof card.value === "number" ? card.value : card.value}
                    </p>
                    <p className="text-xs text-gray-500">{card.label}</p>
                  </Tag>
                );
              })}
            </div>
          )}

          {/* Quick Actions — 2×3 grid */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate({ to: action.to })}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[#22C55E] hover:shadow-md transition-all active:scale-95"
                    data-ocid={action.ocid}
                  >
                    <Icon size={24} className="text-[#22C55E]" />
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watchman Strip */}
          <button
            type="button"
            className="w-full bg-white rounded-2xl border-l-4 border-[#22C55E] border border-gray-100 shadow-sm p-3 flex items-center gap-3 text-left hover:shadow-md transition-all"
            onClick={() =>
              navigate({
                to: user?.watchmanAssigned ? "/watchman" : "/apartment",
              })
            }
            data-ocid="dashboard.watchman_strip"
          >
            <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-[#22C55E]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700">
                {user?.watchmanAssigned
                  ? "Watchman On Duty"
                  : "No watchman assigned yet"}
              </p>
              <p className="text-xs text-gray-400">
                {user?.watchmanAssigned
                  ? "Tap to view gate status"
                  : "Set up a watchman to see gate status here"}
              </p>
            </div>
            <span className="text-xs text-[#22C55E] font-semibold flex-shrink-0">
              {user?.watchmanAssigned ? "View →" : "Set up →"}
            </span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
