// Apartment mode placeholder pages
import { Layout } from "@/components/Layout";
import {
  Bell,
  CreditCard,
  Settings,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export function ApartmentDashboard() {
  return (
    <Layout>
      <div
        className="p-4 flex flex-col gap-4"
        data-ocid="apartment_dashboard.page"
      >
        <div className="pt-2">
          <p className="text-xs uppercase tracking-widest mb-1 text-[#22C55E]">
            Good Morning
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Your Apartment
          </h1>
          <p className="text-sm mt-0.5 text-muted-foreground">Apartment Mode</p>
        </div>
        {/* Wallet summary */}
        <div className="rounded-2xl p-4 bg-white border border-[#22C55E]/30">
          <p className="text-xs text-muted-foreground">
            Apartment Wallet Balance
          </p>
          <p className="font-display text-3xl font-bold mt-1 text-foreground">
            —
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Wallet data loads from backend
          </p>
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Maintenance", icon: CreditCard },
            { label: "Visitors", icon: Users },
            { label: "Notices", icon: Bell },
            { label: "Issues", icon: Wrench },
            { label: "Wallet", icon: Wallet },
            { label: "Settings", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-200"
              >
                <Icon size={24} className="text-[#22C55E]" />
                <span className="text-xs font-body text-center text-foreground">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

export function ApartmentMaintenance() {
  return (
    <Layout>
      <div className="p-4" data-ocid="apartment_maintenance.page">
        <h1 className="font-display text-xl font-bold text-foreground">
          Maintenance
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Track payments and collections
        </p>
        <div
          className="mt-6 rounded-2xl p-8 flex flex-col items-center gap-3 bg-white border border-gray-200"
          data-ocid="apartment_maintenance.empty_state"
        >
          <CreditCard size={40} className="text-muted-foreground" />
          <p className="text-sm text-center text-muted-foreground">
            No maintenance records yet. Add the first payment.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export function ApartmentVisitors() {
  return (
    <Layout>
      <div className="p-4" data-ocid="apartment_visitors.page">
        <h1 className="font-display text-xl font-bold text-foreground">
          Visitor Log
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          All visitors to the apartment
        </p>
        <div
          className="mt-6 rounded-2xl p-8 flex flex-col items-center gap-3 bg-white border border-gray-200"
          data-ocid="apartment_visitors.empty_state"
        >
          <Users size={40} className="text-muted-foreground" />
          <p className="text-sm text-center text-muted-foreground">
            No visitors logged today.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export function ApartmentNotices() {
  return (
    <Layout>
      <div className="p-4" data-ocid="apartment_notices.page">
        <h1 className="font-display text-xl font-bold text-foreground">
          Notice Board
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Announcements for all residents
        </p>
        <div
          className="mt-6 rounded-2xl p-8 flex flex-col items-center gap-3 bg-white border border-gray-200"
          data-ocid="apartment_notices.empty_state"
        >
          <Bell size={40} className="text-muted-foreground" />
          <p className="text-sm text-center text-muted-foreground">
            No notices posted yet.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export function ApartmentMore() {
  return (
    <Layout>
      <div className="p-4" data-ocid="apartment_more.page">
        <h1 className="font-display text-xl font-bold text-foreground">More</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Issues, expenses, settings and more
        </p>
      </div>
    </Layout>
  );
}

export { default as DisputePage } from "./apartment/DisputePage";
export { default as MoveOutPage } from "./apartment/MoveOutPage";
export { default as GuestPage } from "./apartment/GuestPage";
