import { DevelvynLogo } from "@/components/DevelvynLogo";
import { useAuth } from "@/hooks/useAuth";
import type { AppMode } from "@/types";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* Brand tokens */
const B = {
  deepGreen: "#16A34A",
  accent: "#22C55E",
  white: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#DCFCE7",
};

type NavItem = { label: string; icon: typeof Home; to: string; ocid: string };

const APARTMENT_NAV: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/apartment",
    ocid: "apt_nav.dashboard",
  },
  {
    label: "Payments",
    icon: Wallet,
    to: "/apartment/maintenance",
    ocid: "apt_nav.payments",
  },
  {
    label: "Visitors",
    icon: ShieldCheck,
    to: "/apartment/visitors",
    ocid: "apt_nav.visitors",
  },
  {
    label: "Notices",
    icon: MessageSquare,
    to: "/apartment/notices",
    ocid: "apt_nav.notices",
  },
  {
    label: "Documents",
    icon: FileText,
    to: "/apartment/documents",
    ocid: "apt_nav.documents",
  },
];

const FAMILY_NAV: NavItem[] = [
  { label: "Home", icon: Home, to: "/family", ocid: "fam_nav.home" },
  {
    label: "Expenses",
    icon: TrendingUp,
    to: "/family/expenses",
    ocid: "fam_nav.expenses",
  },
  { label: "Tasks", icon: Star, to: "/family/tasks", ocid: "fam_nav.tasks" },
  {
    label: "Grocery",
    icon: ShoppingBag,
    to: "/family/grocery",
    ocid: "fam_nav.grocery",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    to: "/family/calendar",
    ocid: "fam_nav.calendar",
  },
];

const FOUNDER_NAV: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/founder",
    ocid: "founder_nav.dashboard",
  },
  {
    label: "Tickets",
    icon: MessageSquare,
    to: "/founder/tickets",
    ocid: "founder_nav.tickets",
  },
  {
    label: "Feedback",
    icon: Star,
    to: "/founder/feedback",
    ocid: "founder_nav.feedback",
  },
];

const MODE_NAV: Partial<Record<AppMode, NavItem[]>> = {
  apartment: APARTMENT_NAV,
  family: FAMILY_NAV,
  founder: FOUNDER_NAV,
};

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, currentMode, availableModes, logout, setMode } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const mode = currentMode ?? "apartment";
  const navItems = MODE_NAV[mode] ?? [];
  const isWatchman = mode === "watchman";
  const _isFounder = mode === "founder";
  const showToggle =
    availableModes.includes("apartment") && availableModes.includes("family");
  const currentPath = router.state.location.pathname;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === "watchman") navigate({ to: "/watchman" });
    else if (newMode === "founder") navigate({ to: "/founder" });
    else if (newMode === "family") navigate({ to: "/family" });
    else navigate({ to: "/apartment" });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };
  const userInitial = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div
      className="flex flex-col min-h-screen max-w-md mx-auto"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* Top header */}
      <header
        className="flex items-center justify-between px-4 py-2.5 sticky top-0 z-30"
        style={{ backgroundColor: B.deepGreen }}
        data-ocid="layout.header"
      >
        {/* Left: logo — clickable, routes to home of current mode */}
        <div className="flex items-center gap-2">
          <DevelvynLogo
            size={32}
            clickable
            onClick={() => {
              if (mode === "watchman") navigate({ to: "/watchman" });
              else if (mode === "founder") navigate({ to: "/founder" });
              else if (mode === "family") navigate({ to: "/family" });
              else navigate({ to: "/apartment" });
            }}
          />
          <span className="font-bold text-sm" style={{ color: B.white }}>
            Develvyn
          </span>
        </div>

        {/* Center: mode toggle pill */}
        {showToggle && (
          <div
            className="flex items-center rounded-full p-0.5"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            data-ocid="layout.mode_toggle"
          >
            <button
              type="button"
              onClick={() => handleModeSwitch("apartment")}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-smooth"
              style={{
                backgroundColor: mode === "apartment" ? B.white : "transparent",
                color: mode === "apartment" ? B.deepGreen : B.white,
              }}
              data-ocid="layout.toggle.apartment"
            >
              <span>🏢</span> Apt
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("family")}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-smooth"
              style={{
                backgroundColor: mode === "family" ? B.white : "transparent",
                color: mode === "family" ? B.deepGreen : B.white,
              }}
              data-ocid="layout.toggle.family"
            >
              <span>👨‍👩‍👧</span> Family
            </button>
          </div>
        )}

        {/* Right: avatar only — no SOS in top bar */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-smooth"
              style={{ backgroundColor: B.white, color: B.deepGreen }}
              title={user?.name ?? "Profile"}
              data-ocid="layout.profile_button"
            >
              {userInitial}
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-10 w-52 rounded-xl shadow-elevated border z-50 overflow-hidden"
                style={{ backgroundColor: B.white, borderColor: B.border }}
                data-ocid="layout.profile_dropdown"
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: B.border }}
                >
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: B.text }}
                  >
                    {user?.name ?? "User"}
                  </p>
                  <p
                    className="text-xs mt-0.5 capitalize"
                    style={{ color: B.muted }}
                  >
                    {user?.role?.replace(/_/g, " ") ?? ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-medium transition-smooth hover:bg-red-50"
                  style={{ color: "#EF4444" }}
                  data-ocid="layout.sign_out_button"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: isWatchman ? 0 : 72,
          backgroundColor: "#FFFFFF",
        }}
      >
        {children}
      </main>

      {/* Bottom nav */}
      {!isWatchman && navItems.length > 0 && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-20 border-t bg-white"
          style={{ borderColor: B.border }}
          data-ocid="layout.bottom_nav"
        >
          <div className="flex items-center justify-around px-2 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.to ||
                (item.to !== "/apartment" &&
                  item.to !== "/family" &&
                  item.to !== "/founder" &&
                  currentPath.startsWith(item.to));
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate({ to: item.to as "/apartment" })}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-smooth"
                  style={{ color: isActive ? B.accent : B.muted }}
                  data-ocid={item.ocid}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

// SOS is handled within SOSModule.tsx only — not in Layout
