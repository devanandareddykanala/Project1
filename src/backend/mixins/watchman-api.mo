import Common "../types/common";
import WTypes "../types/watchman";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import WatchmanLib "../lib/watchman";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Int "mo:core/Int";

mixin (
  users           : Map.Map<Principal, AuthTypes.User>,
  facilityMap     : Map.Map<Common.ApartmentId, WTypes.FacilityStatus>,
  shifts          : Map.Map<Nat, WTypes.WatchmanShift>,
  shiftIdCounter  : { var next : Nat },
  pendingWatchmen : Map.Map<Text, AuthTypes.PendingWatchman>,
  inviteCodes     : Map.Map<Text, Common.InviteRecord>,
) {
  // Create watchman invite (SuperAdmin only)
  public shared ({ caller }) func createWatchmanInvite(
    watchmanName : Text,
    phone        : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin]);
    let aptId = switch (user.apartmentId) {
      case null return #err("Caller has no apartment");
      case (?a) a;
    };
    // Generate a 6-char alphanumeric token from time+name hash
    let seed = (watchmanName # phone # Time.now().toText()).foldLeft<Nat32>(0, func(acc, c) = acc *% 31 +% c.toNat32());
    let token = (seed % 1_000_000 + 100_000).toNat().toText();
    // inviteCode uses the 6-digit numeric token
    // Simpler: just use the 6-digit number as the token
    let inviteCode = "DWCH-" # token;
    let link = "develvyn.app/join/" # token;
    // 7-day expiry in nanoseconds
    let expiryNs : Int = Time.now() + 7 * 24 * 60 * 60 * 1_000_000_000;
    inviteCodes.add(inviteCode, {
      role        = #Watchman;
      apartmentId = ?aptId;
      flatId      = (null : ?Common.FlatId);
      createdAt   = Time.now();
      expiresAt   = expiryNs;
      var used    = false;
      inviteLink  = link;
    });
    pendingWatchmen.add(inviteCode, {
      principal       = caller;
      userId          = user.id.toText();
      name            = watchmanName;
      phone           = phone;
      docUrl          = "";
      docType         = #Other;
      uploadedAt      = 0;
      submittedAt     = Time.now();
      apartmentId     = aptId.toText();
      status          = #Pending;
      rejectionReason = null;
    });
    #ok(inviteCode # " | " # link);
  };

  // Watchman submits ID document URL after registration
  public shared ({ caller }) func submitWatchmanIdDoc(
    docUrl  : Text,
    docType : AuthTypes.WatchmanIdType,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#Watchman]);
    let phone = user.phone;
    var found = false;
    pendingWatchmen.forEach(func(k, v) {
      if (v.phone == phone) {
        pendingWatchmen.add(k, {
          v with
          principal  = caller;
          docUrl;
          docType;
          uploadedAt = Time.now();
          status     = #Pending;
        });
        found := true;
      };
    });
    if (not found) return #err("No pending watchman record found for your account");
    #ok("Document submitted — awaiting Super Admin approval");
  };

  // Get all pending watchman approvals (SuperAdmin only)
  public shared query ({ caller }) func getPendingWatchmanApprovals() : async [AuthTypes.PendingWatchman] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    var result : [AuthTypes.PendingWatchman] = [];
    pendingWatchmen.forEach(func(_, v) {
      if (v.status == #Pending and v.docUrl != "") {
        result := result.concat([v]);
      };
    });
    result;
  };

  // Approve a watchman (SuperAdmin only)
  public shared ({ caller }) func approveWatchmanId(
    watchmanPrincipal : Principal,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    var updated = false;
    pendingWatchmen.forEach(func(k, v) {
      if (v.principal == watchmanPrincipal) {
        pendingWatchmen.add(k, { v with status = #Approved });
        updated := true;
      };
    });
    if (not updated) return #err("Watchman record not found");
    // Activate the matching user account
    for ((p, u) in users.entries()) {
      if (p == watchmanPrincipal) {
        users.add(p, { u with isActive = true });
      };
    };
    #ok("Watchman approved — they can now access Duty mode");
  };

  // Reject a watchman (SuperAdmin only)
  public shared ({ caller }) func rejectWatchmanId(
    watchmanPrincipal : Principal,
    reason            : Text,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    var updated = false;
    pendingWatchmen.forEach(func(k, v) {
      if (v.principal == watchmanPrincipal) {
        pendingWatchmen.add(k, { v with status = #Rejected; rejectionReason = ?reason });
        updated := true;
      };
    });
    if (not updated) return #err("Watchman record not found");
    #ok("Watchman application rejected");
  };

  // Update facility status (Watchman / WatchmanFamily)
  public shared ({ caller }) func updateFacilityStatus(
    apartmentId : Common.ApartmentId,
    gate        : WTypes.GateStatus,
    waterMotor  : WTypes.WaterMotorStatus,
    lift        : WTypes.LiftStatus,
    cleaning    : WTypes.CleaningStatus,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#Watchman, #WatchmanFamily, #SuperAdmin]);
    WatchmanLib.updateFacilityStatus(facilityMap, apartmentId, gate, waterMotor, lift, cleaning, user.id);
  };

  // Get current facility status (visible to all residents)
  public shared query ({ caller }) func getFacilityStatus(
    apartmentId : Common.ApartmentId,
  ) : async ?WTypes.FacilityStatus {
    WatchmanLib.getFacilityStatus(facilityMap, apartmentId);
  };

  // Start a shift
  public shared ({ caller }) func startShift(
    apartmentId : Common.ApartmentId,
    watchmanId  : Common.UserId,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#Watchman, #WatchmanFamily, #SuperAdmin]);
    WatchmanLib.startShift(shifts, shiftIdCounter, apartmentId, watchmanId);
  };

  // End shift with handover checklist
  public shared ({ caller }) func endShift(
    shiftId   : Nat,
    note      : Text,
    checklist : WTypes.ShiftHandoverChecklist,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#Watchman, #WatchmanFamily, #SuperAdmin]);
    WatchmanLib.endShift(shifts, shiftId, note, checklist);
  };

  // Get active shift for apartment
  public shared query ({ caller }) func getActiveShift(
    apartmentId : Common.ApartmentId,
  ) : async ?WTypes.WatchmanShift {
    WatchmanLib.getActiveShift(shifts, apartmentId);
  };

  // Get full shift history
  public shared query ({ caller }) func getShiftHistory(
    apartmentId : Common.ApartmentId,
  ) : async [WTypes.WatchmanShift] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge, #Watchman, #WatchmanFamily]);
    WatchmanLib.getShiftHistory(shifts, apartmentId);
  };

  // Toggle night mode on active shift
  public shared ({ caller }) func setNightMode(
    shiftId : Nat,
    enabled : Bool,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#Watchman, #WatchmanFamily, #SuperAdmin]);
    WatchmanLib.setNightMode(shifts, shiftId, enabled);
  };
}
