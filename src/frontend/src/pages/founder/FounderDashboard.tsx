import { SubscriptionStatus, createActor } from "@/backend";
import type { PlatformHealth, SubscriptionRow } from "@/backend";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Building2,
  CreditCard,
  Download,
  FileBarChart,
  Megaphone,
  MessageSquare,
  Plus,
  ScrollText,
  TicketCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function SubStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Active: { bg: "bg-green-100", text: "text-green-700" },
    Trial: { bg: "bg-blue-100", text: "text-blue-700" },
    GracePeriod: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Overdue: { bg: "bg-red-100", text: "text-red-700" },
    Inactive: { bg: "bg-gray-100", text: "text-gray-500" },
  };
  const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-500" };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}
    >
      {status}
    </span>
  );
}

export function FounderDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);

  const [statsLoading, setStatsLoading] = useState(true);
  const [apartmentCount, setApartmentCount] = useState<bigint>(0n);
  const [subsDue, setSubsDue] = useState<bigint>(0n);
  const [pendingConfirm, setPendingConfirm] = useState<bigint>(0n);
  const [openTicketCount, setOpenTicketCount] = useState<bigint>(0n);

  const [subsTable, setSubsTable] = useState<SubscriptionRow[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);

  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const [inviteRole, setInviteRole] = useState("Employee");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    Promise.all([
      actor.getApartmentCount().catch(() => 0n),
      actor.getSubscriptionsDueThisWeek().catch(() => 0n),
      actor.getPendingPaymentConfirmations().catch(() => 0n),
      actor.getOpenTicketCount().catch(() => 0n),
    ]).then(([a, s, p, t]) => {
      setApartmentCount(a);
      setSubsDue(s);
      setPendingConfirm(p);
      setOpenTicketCount(t);
      setStatsLoading(false);
    });

    actor
      .getSubscriptionTable()
      .catch(() => [] as SubscriptionRow[])
      .then((rows) => {
        setSubsTable(rows);
        setSubsLoading(false);
      });

    actor
      .getPlatformHealth()
      .catch(() => null)
      .then((h) => {
        setHealth(h);
        setHealthLoading(false);
      });
  }, [actor, isFetching]);

  const handleGenerateInvite = async () => {
    if (!actor) return;
    setInviting(true);
    try {
      const result = await actor.generateFounderInvite(inviteRole);
      if (result.__kind__ === "err") {
        toast.error(result.err);
        return;
      }
      await navigator.clipboard.writeText(result.ok.link);
      toast.success(`${inviteRole} invite copied to clipboard!`);
    } catch {
      toast.error("Failed to generate invite.");
    } finally {
      setInviting(false);
    }
  };

  const subsOverdue = subsTable.filter(
    (r) => r.status === SubscriptionStatus.Overdue,
  );
  const subsOther = subsTable.filter(
    (r) => r.status !== SubscriptionStatus.Overdue,
  );
  const sortedSubs = [...subsOverdue, ...subsOther];

  return (
    <Layout>
      <div
        className="flex flex-col gap-5 px-4 py-5 bg-white min-h-screen"
        data-ocid="founder_dashboard.page"
      >
        {/* Context Switcher */}
        <div
          className="flex items-center gap-1 p-1 bg-gray-100 rounded-full"
          data-ocid="founder_dashboard.context_switcher"
        >
          {[
            { label: "Founder Portal", path: null },
            { label: "My Apartment", path: "/apartment" },
            { label: "My Family", path: "/family" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.path)
                  void navigate({ to: item.path as "/apartment" | "/family" });
              }}
              className="flex-1 text-xs font-medium py-1.5 px-2 rounded-full transition-colors"
              style={{
                backgroundColor: item.path === null ? "#22C55E" : "transparent",
                color: item.path === null ? "#FFFFFF" : "#6B7280",
              }}
              data-ocid={`founder_dashboard.ctx_${item.label.toLowerCase().replace(/ /g, "_")}_tab`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="pt-1">
          <p className="text-xs text-[#22C55E] font-medium uppercase tracking-widest mb-0.5">
            Founder Portal · Develvyn Technologies
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Founder Portal</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hello, {user?.name || "Founder"} — platform overview
          </p>
        </div>

        {/* Stat cards — 4 real backend stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="flex flex-col gap-2 p-4 bg-white border border-[#DCFCE7] rounded-2xl"
            data-ocid="founder_dashboard.apartments_card"
          >
            <Building2 size={18} className="text-[#22C55E]" />
            <p className="text-2xl font-bold text-gray-900">
              {statsLoading ? "—" : String(apartmentCount)}
            </p>
            <p className="text-xs text-gray-500">Active Apartments</p>
          </div>
          <div
            className="flex flex-col gap-2 p-4 bg-white border border-[#DCFCE7] rounded-2xl"
            data-ocid="founder_dashboard.subs_due_card"
          >
            <CreditCard size={18} className="text-yellow-500" />
            <p className="text-2xl font-bold text-yellow-600">
              {statsLoading ? "—" : String(subsDue)}
            </p>
            <p className="text-xs text-gray-500">Subscriptions Due</p>
          </div>
          <div
            className="flex flex-col gap-2 p-4 bg-white border border-[#DCFCE7] rounded-2xl"
            data-ocid="founder_dashboard.pending_confirm_card"
          >
            <Users size={18} className="text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">
              {statsLoading ? "—" : String(pendingConfirm)}
            </p>
            <p className="text-xs text-gray-500">Pending Confirmations</p>
          </div>
          <div
            className="flex flex-col gap-2 p-4 bg-white border border-[#DCFCE7] rounded-2xl"
            data-ocid="founder_dashboard.open_tickets_card"
          >
            <TicketCheck size={18} className="text-red-500" />
            <p className="text-2xl font-bold text-red-600">
              {statsLoading ? "—" : String(openTicketCount)}
            </p>
            <p className="text-xs text-gray-500">Open Tickets</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="flex flex-col gap-3"
          data-ocid="founder_dashboard.quick_actions"
        >
          <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => toast.info("Coming in Phase 2")}
              className="flex items-center gap-3 bg-white border border-[#DCFCE7] rounded-2xl px-4 py-3 hover:border-[#22C55E] transition-colors text-left"
              data-ocid="founder_dashboard.send_announcement_button"
            >
              <Megaphone size={16} className="text-[#22C55E] shrink-0" />
              <span className="text-sm font-medium text-gray-900 leading-tight">
                Send Announcement
              </span>
            </button>
            <button
              type="button"
              onClick={() => void navigate({ to: "/register" })}
              className="flex items-center gap-3 bg-white border border-[#DCFCE7] rounded-2xl px-4 py-3 hover:border-[#22C55E] transition-colors text-left"
              data-ocid="founder_dashboard.register_apartment_button"
            >
              <Building2 size={16} className="text-[#22C55E] shrink-0" />
              <span className="text-sm font-medium text-gray-900 leading-tight">
                Register Apartment
              </span>
            </button>
            <button
              type="button"
              onClick={() => toast.info("Coming in Phase 2")}
              className="flex items-center gap-3 bg-white border border-[#DCFCE7] rounded-2xl px-4 py-3 hover:border-[#22C55E] transition-colors text-left"
              data-ocid="founder_dashboard.export_report_button"
            >
              <Download size={16} className="text-[#22C55E] shrink-0" />
              <span className="text-sm font-medium text-gray-900 leading-tight">
                Export Report
              </span>
            </button>
            <button
              type="button"
              onClick={() => toast.info("Coming in Phase 2")}
              className="flex items-center gap-3 bg-white border border-[#DCFCE7] rounded-2xl px-4 py-3 hover:border-[#22C55E] transition-colors text-left"
              data-ocid="founder_dashboard.audit_log_button"
            >
              <ScrollText size={16} className="text-[#22C55E] shrink-0" />
              <span className="text-sm font-medium text-gray-900 leading-tight">
                View Audit Log
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Table */}
        <div
          className="flex flex-col gap-3"
          data-ocid="founder_dashboard.subscription_table"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Subscriptions</h2>
            <span className="text-xs text-gray-400">
              {subsTable.length} apartments
            </span>
          </div>
          {subsLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : sortedSubs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No subscription data
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedSubs.map((row, i) => (
                <div
                  key={String(row.apartmentId)}
                  className={`flex items-center justify-between bg-white border rounded-xl px-4 py-3 ${
                    row.status === SubscriptionStatus.Overdue
                      ? "border-red-200"
                      : "border-[#DCFCE7]"
                  }`}
                  data-ocid={`founder_dashboard.sub.item.${i + 1}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {row.apartmentName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {row.city} · {String(row.flatsCount)} flats
                    </p>
                  </div>
                  <SubStatusBadge status={String(row.status)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Health */}
        <div
          className="flex flex-col gap-3"
          data-ocid="founder_dashboard.platform_health"
        >
          <h2 className="font-semibold text-gray-900">Platform Health</h2>
          {healthLoading ? (
            <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
          ) : health ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Active Users",
                  value: String(health.activeUsers),
                  icon: <Users size={14} className="text-[#22C55E]" />,
                },
                {
                  label: "Uptime",
                  value: `${String(health.uptimePercent)}%`,
                  icon: <Activity size={14} className="text-blue-500" />,
                },
                {
                  label: "SOS Count",
                  value: String(health.sosCount),
                  icon: <Activity size={14} className="text-red-500" />,
                },
                {
                  label: "Failed Logins",
                  value: String(health.failedLogins),
                  icon: <Users size={14} className="text-orange-500" />,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 bg-white border border-[#DCFCE7] rounded-xl px-3 py-2.5"
                >
                  {item.icon}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.value}
                    </p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              Health data unavailable
            </p>
          )}
        </div>

        {/* Add Team Member */}
        <div
          className="flex flex-col gap-3"
          data-ocid="founder_dashboard.team_invite"
        >
          <h2 className="font-semibold text-gray-900">Add Team Member</h2>
          <div className="flex gap-2">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="flex-1 border border-[#DCFCE7] rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              data-ocid="founder_dashboard.invite_role_select"
            >
              <option value="CoFounder">Co-Founder</option>
              <option value="Employee">Employee</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Contractor">Contractor</option>
            </select>
            <button
              type="button"
              disabled={inviting}
              onClick={() => void handleGenerateInvite()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E] text-white rounded-xl text-sm font-medium hover:bg-[#16A34A] transition-colors disabled:opacity-50"
              data-ocid="founder_dashboard.generate_invite_button"
            >
              <Plus size={14} />
              {inviting ? "Generating..." : "Generate Invite"}
            </button>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/founder/tickets" })}
            className="flex items-center justify-between bg-white border border-[#DCFCE7] rounded-2xl px-4 py-3 hover:border-[#22C55E] transition-colors"
            data-ocid="founder_dashboard.all_tickets_link"
          >
            <div className="flex items-center gap-2">
              <TicketCheck size={16} className="text-[#22C55E]" />
              <span className="text-sm font-medium text-gray-900">Tickets</span>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </button>
          <button
            type="button"
            onClick={() => void navigate({ to: "/founder/feedback" })}
            className="flex items-center justify-between bg-white border border-[#DCFCE7] rounded-2xl px-4 py-3 hover:border-[#22C55E] transition-colors"
            data-ocid="founder_dashboard.all_feedback_link"
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-900">
                Feedback
              </span>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-[#DCFCE7]">
          <p className="text-xs text-gray-400 text-center">
            Develvyn Technologies Pvt Ltd — support@develvyntechnologies.com
          </p>
        </div>
      </div>
    </Layout>
  );
}
