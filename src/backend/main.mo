import Map "mo:core/Map";

import Common     "types/common";
import AuthTypes  "types/auth";
import AptTypes   "types/apartment";
import MTypes     "types/maintenance";
import VTypes     "types/visitors";
import NTypes     "types/notices";
import ITypes     "types/issues";
import ETypes     "types/expenses";
import WTypes     "types/watchman";
import SosTypes   "types/sos";
import PTypes     "types/parking";
import FTypes     "types/family";
import SpTypes    "types/support";
import ConsentT   "types/consent";
import DisputeT   "types/dispute";
import MoveOutT   "types/moveout";
import GuestT     "types/guest";
import WatchFamT  "types/watchman_family";
import FeedbackT  "types/feedback";

import AuthApi        "mixins/auth-api";
import ApartmentApi   "mixins/apartment-api";
import MaintenanceApi "mixins/maintenance-api";
import VisitorsApi    "mixins/visitors-api";
import NoticesApi     "mixins/notices-api";
import IssuesApi      "mixins/issues-api";
import ExpensesApi    "mixins/expenses-api";
import WatchmanApi    "mixins/watchman-api";
import SosApi         "mixins/sos-api";
import ParkingApi     "mixins/parking-api";
import FamilyApi      "mixins/family-api";
import SupportApi        "mixins/support-api";
import ConsentApi        "mixins/consent-api";
import DisputeApi        "mixins/dispute-api";
import MoveOutApi        "mixins/moveout-api";
import GuestApi          "mixins/guest-api";
import WatchmanFamilyApi "mixins/watchman-family-api";
import InAppFeedbackApi  "mixins/inapfeedback-api";
import FounderApi "mixins/founder-api";



actor {
  // ── Shared ID counter record (passed by reference to all mixins) ──────────
  let ids = {
    var next : Nat = 1;
  };

  // ── Auth — phone index + invite codes + founder state ───────────────────
  let users         : Map.Map<Principal, AuthTypes.User>  = Map.empty();
  let phoneIndex    : Map.Map<Text, Principal>            = Map.empty();
  let inviteCodes   : Map.Map<Text, Common.InviteRecord>  = Map.empty();
  // founderState holds the first-ever Founder's principal (auto-detected on first login)
  let founderState  = { var principal : ?Principal = null };

  include AuthApi(users, ids, phoneIndex, inviteCodes, founderState);

  // ── Apartment ─────────────────────────────────────────────────────────────
  let apartments      : Map.Map<Common.ApartmentId, AptTypes.Apartment>  = Map.empty();
  let flats           : Map.Map<Common.FlatId, AptTypes.Flat>             = Map.empty();
  let inchargeRecords : Map.Map<Nat, AptTypes.InchargeRecord>             = Map.empty();

  include ApartmentApi(users, apartments, flats, inchargeRecords, ids, ids, ids);

  // ── Maintenance & Wallet ──────────────────────────────────────────────────
  let payments   : Map.Map<Nat, MTypes.MaintenancePayment> = Map.empty();
  let wallet     : Map.Map<Nat, MTypes.WalletEntry>        = Map.empty();
  let upiHistory : Map.Map<Common.ApartmentId, [{ upiId : Text; qrImageUrl : ?Text; effectiveFrom : Int; archivedAt : ?Int }]> = Map.empty();

  include MaintenanceApi(users, payments, wallet, ids, ids, upiHistory);

  // ── Visitors ──────────────────────────────────────────────────────────────
  let visitors : Map.Map<Nat, VTypes.VisitorEntry> = Map.empty();

  include VisitorsApi(users, visitors, ids);

  // ── Notices ───────────────────────────────────────────────────────────────
  let notices : Map.Map<Nat, NTypes.Notice> = Map.empty();

  include NoticesApi(users, notices, ids);

  // ── Issues ────────────────────────────────────────────────────────────────
  let issues : Map.Map<Nat, ITypes.Issue> = Map.empty();

  include IssuesApi(users, issues, ids);

  // ── Apartment Expenses ────────────────────────────────────────────────────
  let expenses : Map.Map<Nat, ETypes.ApartmentExpense> = Map.empty();

  include ExpensesApi(users, expenses, ids);

  // ── Watchman ──────────────────────────────────────────────────────────────
  let facilityMap     : Map.Map<Common.ApartmentId, WTypes.FacilityStatus> = Map.empty();
  let shifts          : Map.Map<Nat, WTypes.WatchmanShift>                  = Map.empty();
  let pendingWatchmen : Map.Map<Text, AuthTypes.PendingWatchman>            = Map.empty();

  include WatchmanApi(users, facilityMap, shifts, ids, pendingWatchmen, inviteCodes : Map.Map<Text, Common.InviteRecord>);

  // ── SOS ───────────────────────────────────────────────────────────────────
  let alerts : Map.Map<Nat, SosTypes.SOSAlert> = Map.empty();

  include SosApi(users, alerts, ids);

  // ── Parking ───────────────────────────────────────────────────────────────
  let parkingSlots : Map.Map<Nat, PTypes.ParkingSlot> = Map.empty();

  include ParkingApi(users, parkingSlots, ids);

  // ── Family Mode (fully isolated per principal, cross-mode read via notices/payments) ──
  let familyExpenses    : Map.Map<Nat, FTypes.FamilyExpense>        = Map.empty();
  let familyTasks       : Map.Map<Nat, FTypes.FamilyTask>           = Map.empty();
  let groceryItems      : Map.Map<Nat, FTypes.GroceryItem>          = Map.empty();
  let calendarEvents    : Map.Map<Nat, FTypes.FamilyCalendarEvent>  = Map.empty();
  let billSubscriptions : Map.Map<Nat, FTypes.BillSubscription>     = Map.empty();
  let healthRecords     : Map.Map<Nat, FTypes.HealthRecord>         = Map.empty();
  let documentVault     : Map.Map<Nat, FTypes.DocumentVaultEntry>   = Map.empty();
  let familyReminders   : Map.Map<Nat, FTypes.FamilyReminder>       = Map.empty();
  let familyContacts    : Map.Map<Nat, FTypes.FamilyContact>        = Map.empty();

  include FamilyApi(
    familyExpenses, familyTasks, groceryItems, calendarEvents,
    billSubscriptions, healthRecords, documentVault, familyReminders,
    familyContacts, ids,
    users, payments, notices,
  );

  // ── Founder Support Portal ────────────────────────────────────────────────
  let tickets        : Map.Map<Nat, SpTypes.SupportTicket>            = Map.empty();
  let feedbacks      : Map.Map<Nat, SpTypes.AppFeedback>              = Map.empty();
  let ticketMessages : Map.Map<Nat, SpTypes.TicketMessage>            = Map.empty();

  let msgIdCounter = { var next : Nat = 0 };

  include SupportApi(users, tickets, ticketMessages, feedbacks, ids, msgIdCounter, ids);

  // ── DPDP Consent ──────────────────────────────────────────────────────────
  let consentRecords : Map.Map<Text, ConsentT.ConsentRecord> = Map.empty();

  include ConsentApi(consentRecords);

  // ── Dispute Resolution ────────────────────────────────────────────────────
  let disputes : Map.Map<Text, DisputeT.DisputeRecord> = Map.empty();

  include DisputeApi(users, disputes, ids);

  // ── Move-In / Move-Out ────────────────────────────────────────────────────
  let moveOutChecklists : Map.Map<Text, MoveOutT.MoveOutChecklist> = Map.empty();

  include MoveOutApi(users, moveOutChecklists, inviteCodes, ids);

  // ── Guest / Temporary Access ──────────────────────────────────────────────
  let guests : Map.Map<Text, GuestT.GuestRecord> = Map.empty();

  include GuestApi(users, guests, inviteCodes, ids);

  // ── Watchman Family Members ───────────────────────────────────────────────
  let watchmanFamily : Map.Map<Text, WatchFamT.WatchmanFamilyMember> = Map.empty();

  include WatchmanFamilyApi(users, watchmanFamily, inviteCodes, ids);

  // ── In-App Feedback ───────────────────────────────────────────────────────
  let inappFeedbacks : Map.Map<Text, FeedbackT.FeedbackRecord> = Map.empty();

  include InAppFeedbackApi(users, inappFeedbacks, ids);

  // ── Founder Portal API ────────────────────────────────────────────────────
  include FounderApi(users, apartments, tickets, inviteCodes, alerts, ids);
}
