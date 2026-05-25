import { OnboardingSlides } from "@/components/OnboardingSlides";
import { SplashScreen } from "@/components/SplashScreen";
import {
  FounderDashboard,
  FounderFeedback,
  FounderTickets,
} from "@/pages/FounderPages";
import { InviteActivationPage } from "@/pages/InviteActivationPage";
import { LoginPage } from "@/pages/LoginPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { RegisterPage } from "@/pages/RegisterPage";
import {
  WatchmanFamilyPage,
  WatchmanHome,
  WatchmanOnboardingPage,
} from "@/pages/WatchmanPages";
import { ApartmentDashboard } from "@/pages/apartment/ApartmentDashboard";
import { ApartmentMore } from "@/pages/apartment/ApartmentMore";
import { ApartmentWallet } from "@/pages/apartment/ApartmentWallet";
import { ExpenseTracker } from "@/pages/apartment/ExpenseTracker";
import { FacilityStatus } from "@/pages/apartment/FacilityStatus";
import { InchargeManager } from "@/pages/apartment/InchargeManager";
import { IssueManagement } from "@/pages/apartment/IssueManagement";
import { MaintenanceTracker } from "@/pages/apartment/MaintenanceTracker";
import { NoticeBoard } from "@/pages/apartment/NoticeBoard";
import { ParkingManagement } from "@/pages/apartment/ParkingManagement";
import { SOSModule } from "@/pages/apartment/SOSModule";
import { VisitorLog } from "@/pages/apartment/VisitorLog";
import { BillTracker } from "@/pages/family/BillTracker";
import { DocumentVault } from "@/pages/family/DocumentVault";
import { FamilyCalendar } from "@/pages/family/FamilyCalendar";
import { FamilyContacts } from "@/pages/family/FamilyContacts";
import { FamilyDashboard } from "@/pages/family/FamilyDashboard";
import { FamilyExpenses } from "@/pages/family/FamilyExpenses";
import { FamilyMore } from "@/pages/family/FamilyMore";
import { FamilyTasks } from "@/pages/family/FamilyTasks";
import { GroceryList } from "@/pages/family/GroceryList";
import { HealthRecords } from "@/pages/family/HealthRecords";
import { Reminders } from "@/pages/family/Reminders";
import { useAppStore } from "@/store/app";
import { useAuthStore } from "@/store/auth";
import { ROLE_MODE_ACCESS } from "@/types";
import {
  Navigate,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";

import { DisputePage, GuestPage, MoveOutPage } from "@/pages/ApartmentPages";
import { CancelRefundPage } from "@/pages/CancelRefundPage";
import { TermsConditionsPage } from "@/pages/TermsConditionsPage";
import { ApartmentDocuments } from "@/pages/apartment/ApartmentDocuments";
// ----- Route guards -----
const requireAuth = () => {
  const { isLoggedIn } = useAuthStore.getState();
  if (!isLoggedIn) throw redirect({ to: "/login" });
};

const requireModeAccess =
  (mode: "apartment" | "family" | "watchman" | "founder") => () => {
    requireAuth();
    const store = useAuthStore.getState();
    if (!store.isLoggedIn || !store.user) throw redirect({ to: "/login" });
    const role = store.user.role;
    if (!ROLE_MODE_ACCESS[role]?.[mode]) {
      const modes = ["apartment", "family", "watchman", "founder"] as const;
      const first = modes.find((m) => ROLE_MODE_ACCESS[role]?.[m]);
      throw redirect({ to: first ? `/${first}` : "/login" });
    }
  };

// ----- Root -----
const rootRoute = createRootRoute();

// ----- Splash -----
const splashRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/splash",
  component: function SplashPage() {
    const { isOnboardingSeen } = useAppStore();
    const { isLoggedIn } = useAuthStore();
    const navigate = splashRoute.useNavigate();
    const handleComplete = () => {
      if (isLoggedIn) {
        const mode = useAuthStore.getState().currentMode;
        void navigate({
          to:
            mode === "watchman"
              ? "/watchman"
              : mode === "founder"
                ? "/founder"
                : mode === "family"
                  ? "/family"
                  : "/apartment",
          replace: true,
        });
      } else if (isOnboardingSeen) {
        void navigate({ to: "/login", replace: true });
      } else {
        void navigate({ to: "/onboarding", replace: true });
      }
    };
    return <SplashScreen onComplete={handleComplete} />;
  },
});

// ----- Onboarding -----
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: function OnboardingPage() {
    const { markOnboardingSeen } = useAppStore();
    const navigate = onboardingRoute.useNavigate();
    const handleComplete = () => {
      markOnboardingSeen();
      void navigate({ to: "/login", replace: true });
    };
    return <OnboardingSlides onComplete={handleComplete} />;
  },
});

// ----- Login -----
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// ----- Register -----
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

// ----- Join (invite activation) -----
const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join",
  component: InviteActivationPage,
});

// ----- Index redirect -----
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function IndexRedirect() {
    return <Navigate to="/splash" />;
  },
});

// ----- Apartment routes -----
const apartmentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment",
  beforeLoad: requireModeAccess("apartment"),
  component: ApartmentDashboard,
});
const apartmentMaintenanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/maintenance",
  beforeLoad: requireModeAccess("apartment"),
  component: MaintenanceTracker,
});
const apartmentVisitorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/visitors",
  beforeLoad: requireModeAccess("apartment"),
  component: VisitorLog,
});
const apartmentNoticesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/notices",
  beforeLoad: requireModeAccess("apartment"),
  component: NoticeBoard,
});
const apartmentIssuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/issues",
  beforeLoad: requireModeAccess("apartment"),
  component: IssueManagement,
});
const apartmentExpensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/expenses",
  beforeLoad: requireModeAccess("apartment"),
  component: ExpenseTracker,
});
const apartmentWalletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/wallet",
  beforeLoad: requireModeAccess("apartment"),
  component: ApartmentWallet,
});
const apartmentInchargeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/incharge",
  beforeLoad: requireModeAccess("apartment"),
  component: InchargeManager,
});
const apartmentSOSRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/sos",
  beforeLoad: requireModeAccess("apartment"),
  component: SOSModule,
});
const apartmentStatusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/status",
  beforeLoad: requireModeAccess("apartment"),
  component: FacilityStatus,
});
const apartmentParkingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/parking",
  beforeLoad: requireModeAccess("apartment"),
  component: ParkingManagement,
});
const apartmentDocumentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/documents",
  beforeLoad: requireModeAccess("apartment"),
  component: ApartmentDocuments,
});
const apartmentMoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/more",
  beforeLoad: requireModeAccess("apartment"),
  component: ApartmentMore,
});

// ----- Family routes -----
const familyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family",
  beforeLoad: requireModeAccess("family"),
  component: FamilyDashboard,
});
const familyExpensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/expenses",
  beforeLoad: requireModeAccess("family"),
  component: FamilyExpenses,
});
const familyTasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/tasks",
  beforeLoad: requireModeAccess("family"),
  component: FamilyTasks,
});
const familyGroceryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/grocery",
  beforeLoad: requireModeAccess("family"),
  component: GroceryList,
});
const familyCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/calendar",
  beforeLoad: requireModeAccess("family"),
  component: FamilyCalendar,
});
const familyBillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/bills",
  beforeLoad: requireModeAccess("family"),
  component: BillTracker,
});
const familyHealthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/health",
  beforeLoad: requireModeAccess("family"),
  component: HealthRecords,
});
const familyDocumentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/documents",
  beforeLoad: requireModeAccess("family"),
  component: DocumentVault,
});
const familyRemindersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/reminders",
  beforeLoad: requireModeAccess("family"),
  component: Reminders,
});
const familyContactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/contacts",
  beforeLoad: requireModeAccess("family"),
  component: FamilyContacts,
});
const familyMoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family/more",
  beforeLoad: requireModeAccess("family"),
  component: FamilyMore,
});

const apartmentDisputeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/dispute",
  beforeLoad: requireModeAccess("apartment"),
  component: DisputePage,
});
const apartmentMoveOutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/moveout",
  beforeLoad: requireModeAccess("apartment"),
  component: MoveOutPage,
});
const apartmentGuestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apartment/guests",
  beforeLoad: requireModeAccess("apartment"),
  component: GuestPage,
});

// ----- Watchman routes -----
const watchmanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watchman",
  beforeLoad: requireModeAccess("watchman"),
  component: WatchmanHome,
});

const watchmanOnboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watchman/onboarding",
  beforeLoad: requireModeAccess("watchman"),
  component: WatchmanOnboardingPage,
});
const watchmanFamilyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watchman/family",
  beforeLoad: requireModeAccess("watchman"),
  component: WatchmanFamilyPage,
});

const privacyPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy-policy",
  component: PrivacyPolicyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms-and-conditions",
  component: TermsConditionsPage,
});

const cancelRefundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cancel-refund-policy",
  component: CancelRefundPage,
});

// ----- Founder routes -----
const founderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/founder",
  beforeLoad: requireModeAccess("founder"),
  component: FounderDashboard,
});
const founderTicketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/founder/tickets",
  beforeLoad: requireModeAccess("founder"),
  component: FounderTickets,
});
const founderFeedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/founder/feedback",
  beforeLoad: requireModeAccess("founder"),
  component: FounderFeedback,
});

// ----- Router -----
const routeTree = rootRoute.addChildren([
  indexRoute,
  splashRoute,
  onboardingRoute,
  loginRoute,
  registerRoute,
  joinRoute,
  apartmentRoute,
  apartmentMaintenanceRoute,
  apartmentVisitorsRoute,
  apartmentNoticesRoute,
  apartmentIssuesRoute,
  apartmentExpensesRoute,
  apartmentWalletRoute,
  apartmentInchargeRoute,
  apartmentSOSRoute,
  apartmentStatusRoute,
  apartmentParkingRoute,
  apartmentDocumentsRoute,
  apartmentMoreRoute,
  apartmentDisputeRoute,
  apartmentMoveOutRoute,
  apartmentGuestsRoute,
  familyRoute,
  familyExpensesRoute,
  familyTasksRoute,
  familyGroceryRoute,
  familyCalendarRoute,
  familyBillsRoute,
  familyHealthRoute,
  familyDocumentsRoute,
  familyRemindersRoute,
  familyContactsRoute,
  familyMoreRoute,
  watchmanRoute,
  watchmanOnboardingRoute,
  watchmanFamilyRoute,
  founderRoute,
  founderTicketsRoute,
  founderFeedbackRoute,
  privacyPolicyRoute,
  termsRoute,
  cancelRefundRoute,
]);

const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  // White-dominant theme — remove forced dark class
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            backgroundColor: "#FFFFFF",
            color: "#14532D",
            border: "1px solid #DCFCE7",
          },
        }}
      />
    </>
  );
}
