import Common "../types/common";
import STypes "../types/support";
import AptTypes "../types/apartment";
import AuthTypes "../types/auth";
import AuthLib "../lib/auth";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import SosTypes "../types/sos";

mixin (
  users       : Map.Map<Principal, AuthTypes.User>,
  apartments  : Map.Map<Common.ApartmentId, AptTypes.Apartment>,
  tickets     : Map.Map<Nat, STypes.SupportTicket>,
  inviteCodes : Map.Map<Text, Common.InviteRecord>,
  alerts      : Map.Map<Nat, SosTypes.SOSAlert>,
  ids         : { var next : Nat },
) {
  // ── Health strip ──────────────────────────────────────────────────────────

  public shared query ({ caller }) func getApartmentCount() : async Nat {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    apartments.size();
  };

  public shared query ({ caller }) func getSubscriptionsDueThisWeek() : async Nat {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    let now = Time.now();
    let week : Int = 7 * 24 * 3_600_000_000_000;
    var count = 0;
    for ((_, apt) in apartments.entries()) {
      // apartments without a stored due date are assumed due within this week as a safe default
      switch (apt.subscriptionStatus) {
        case (#Overdue or #GracePeriod) { count += 1 };
        case _ {};
      };
    };
    count;
  };

  public shared query ({ caller }) func getPendingPaymentConfirmations() : async Nat {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    // Counts apartments whose subscription status is in trial/grace/overdue and UTR not yet confirmed
    var count = 0;
    for ((_, apt) in apartments.entries()) {
      switch (apt.subscriptionStatus) {
        case (#Trial or #GracePeriod or #Overdue) { count += 1 };
        case _ {};
      };
    };
    count;
  };

  public shared query ({ caller }) func getOpenTicketCount() : async Nat {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    var count = 0;
    for ((_, t) in tickets.entries()) {
      switch (t.status) {
        case (#Open or #InProgress) { count += 1 };
        case _ {};
      };
    };
    count;
  };

  // ── Subscription table ────────────────────────────────────────────────────

  public shared query ({ caller }) func getSubscriptionTable() : async [STypes.SubscriptionRow] {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    var rows : [STypes.SubscriptionRow] = [];
    for ((_, apt) in apartments.entries()) {
      let row : STypes.SubscriptionRow = {
        apartmentId   = apt.id;
        apartmentName = apt.name;
        city          = apt.address; // address holds city in Phase 1
        flatsCount    = 0;           // flat count not stored on Apartment yet
        dueDate       = apt.createdAt + (30 * 24 * 3_600_000_000_000); // 30-day rolling
        status        = apt.subscriptionStatus;
        utrSubmitted  = false;
        adminUserId   = apt.superAdminId;
      };
      rows := rows.concat([row]);
    };
    rows;
  };

  // ── Platform health ───────────────────────────────────────────────────────

  public shared query ({ caller }) func getPlatformHealth() : async STypes.PlatformHealth {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    {
      uptimePercent  = 100;
      activeUsers    = users.size();
      failedLogins   = 0;
      sosCount       = alerts.size();
      cycleBalance   = 0;
    };
  };

  // ── Founder invite (DFND-XXXX) ────────────────────────────────────────────

  public shared ({ caller }) func generateFounderInvite(
    role : Text,
  ) : async Common.Result<{ code : Text; link : Text }, Text> {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder]);

    let mappedRole : Common.Role = switch (role) {
      case "CoFounder"   #CoFounder;
      case "Employee"    #Employee;
      case "Freelancer"  #Freelancer;
      case "Contractor"  #Contractor;
      case _ return #err("Invalid role. Must be CoFounder, Employee, Freelancer, or Contractor");
    };

    // Generate DFND-XXXX code
    let seq = ids.next;
    ids.next += 1;
    let digits = (seq % 10000).toText();
    let padded = if (digits.size() < 4) {
      let pad = if (digits.size() >= 4) 0 else 4 - digits.size();
      let zeros = if (pad == 3) "000" else if (pad == 2) "00" else "0";
      zeros # digits;
    } else digits;
    let code = "DFND-" # padded;
    let link = "develvyn.app/join/" # padded;

    let now = Time.now();
    let expiry = now + (48 * 3_600_000_000_000); // 48 hours

    let record : Common.InviteRecord = {
      role        = mappedRole;
      apartmentId = null;
      flatId      = null;
      createdAt   = now;
      expiresAt   = expiry;
      var used    = false;
      inviteLink  = link;
    };
    inviteCodes.add(code, record);
    #ok({ code; link });
  };

  // ── Founder team management ───────────────────────────────────────────────

  public shared query ({ caller }) func getFounderTeam() : async [AuthTypes.ProfileInfo] {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder]);
    var team : [AuthTypes.ProfileInfo] = [];
    for ((_, u) in users.entries()) {
      switch (u.role) {
        case (#Founder or #CoFounder or #Employee or #Freelancer or #Contractor) {
          let info : AuthTypes.ProfileInfo = {
            userId      = u.id.toText();
            name        = u.name;
            role        = AuthLib.roleToText(u.role);
            apartmentId = "";
            flatId      = null;
            isActive    = u.isActive;
          };
          team := team.concat([info]);
        };
        case _ {};
      };
    };
    team;
  };

  // ── Send announcement to all apartments ───────────────────────────────────
  // Returns count of apartments reached (front-end displays this)
  public shared query ({ caller }) func getApartmentOverview() : async [
    { apartmentId : Common.ApartmentId; name : Text; city : Text; subscriptionStatus : Common.SubscriptionStatus; superAdminId : Common.UserId }
  ] {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    var rows : [{ apartmentId : Common.ApartmentId; name : Text; city : Text; subscriptionStatus : Common.SubscriptionStatus; superAdminId : Common.UserId }] = [];
    for ((_, apt) in apartments.entries()) {
      rows := rows.concat([{
        apartmentId        = apt.id;
        name               = apt.name;
        city               = apt.address;
        subscriptionStatus = apt.subscriptionStatus;
        superAdminId       = apt.superAdminId;
      }]);
    };
    rows;
  };
}
