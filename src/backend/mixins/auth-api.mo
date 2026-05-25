import Common "../types/common";
import AuthTypes "../types/auth";
import AuthLib "../lib/auth";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Nat32 "mo:core/Nat32";
import Char "mo:core/Char";

mixin (
  users         : Map.Map<Principal, AuthTypes.User>,
  idCounter     : { var next : Nat },
  phoneIndex    : Map.Map<Text, Principal>,
  inviteCodes   : Map.Map<Text, Common.InviteRecord>,
  founderState  : { var principal : ?Principal },
) {
  // ── Internet Identity login — caller Principal is the identity ────────────
  // If no Founder exists yet, this caller automatically becomes Founder.
  public shared ({ caller }) func loginWithII() : async Common.Result<AuthTypes.ProfileInfo, Text> {
    switch (founderState.principal) {
      case null {
        // First ever login — auto-register as Founder
        let user = AuthLib.registerUser(users, idCounter, caller, "Founder", "", #Founder, null, null);
        founderState.principal := ?caller;
        #ok(AuthLib.toProfileInfo(user));
      };
      case (?_) {
        switch (AuthLib.getUser(users, caller)) {
          case (?u) #ok(AuthLib.toProfileInfo(u));
          case null #err("unknown"); // new user — frontend routes to onboarding
        };
      };
    };
  };

  // ── Check if a Founder has already been registered ────────────────────────
  public shared query func isFounderRegistered() : async Bool {
    founderState.principal != null;
  };

  // ── Return the caller's role, or null if not yet registered ──────────────
  public shared query ({ caller }) func getMyRole() : async ?Text {
    switch (AuthLib.getUser(users, caller)) {
      case null null;
      case (?u) ?AuthLib.roleToText(u.role);
    };
  };

  // ── Register a brand-new apartment — caller (II principal) becomes SuperAdmin
  public shared ({ caller }) func registerApartment(
    name  : Text,
    phone : Text,
  ) : async Common.Result<Text, Text> {
    if (users.get(caller) != null) return #err("Your account already exists. Please log in.");
    let user = AuthLib.registerUser(users, idCounter, caller, name # " Admin", phone, #SuperAdmin, null, null);
    if (phone != "") { phoneIndex.add(phone, caller) };
    #ok(user.id.toText());
  };

  // ── Register via invite code — validates expiry, marks used, creates user ─
  public shared ({ caller }) func registerWithInvite(
    code  : Text,
    name  : Text,
    phone : Text,
  ) : async Common.Result<Text, Text> {
    if (users.get(caller) != null) return #err("Your account already exists. Please log in.");
    let invite = switch (inviteCodes.get(code)) {
      case null return #err("Invite code not found. Please check the code and try again.");
      case (?i) i;
    };
    if (invite.used) return #err("This invite code has already been used.");
    if (Time.now() > invite.expiresAt) return #err("This code has expired. Ask your Super Admin to send a new one.");
    invite.used := true;
    let user = AuthLib.registerUser(users, idCounter, caller, name, phone, invite.role, invite.flatId, invite.apartmentId);
    if (phone != "") { phoneIndex.add(phone, caller) };
    #ok(user.id.toText());
  };

  // ── Generate an invite code (D-prefix, role-aware expiry) ─────────────────
  public shared ({ caller }) func generateInviteCode(
    role   : Text,
    flatId : ?Text,
  ) : async Common.Result<{ code : Text; link : Text; expiresAt : Int }, Text> {
    // Only authorised roles can generate codes
    let user = switch (users.get(caller)) {
      case null return #err("You must be logged in to generate an invite code.");
      case (?u) u;
    };
    let (prefix, expiryNs) : (Text, Int) = switch (role) {
      case "apartment" ("DAPT", 48 * 60 * 60 * 1_000_000_000);
      case "family"    ("DFAM", 48 * 60 * 60 * 1_000_000_000);
      case "watchman"  ("DWCH", 7 * 24 * 60 * 60 * 1_000_000_000);
      case "founder"   ("DFND", 48 * 60 * 60 * 1_000_000_000);
      case _           return #err("Invalid role. Use: apartment, family, watchman, or founder.");
    };
    let mappedRole : Common.Role = switch (role) {
      case "apartment" #FlatAdmin;
      case "family"    #FamilyMember;
      case "watchman"  #Watchman;
      case "founder"   #CoFounder;
      case _           #FlatAdmin;
    };
    // 4-digit numeric suffix derived from time + caller
    let seed : Nat32 = caller.toText().foldLeft<Nat32>(
      (Time.now() % 9999).toText().foldLeft<Nat32>(0, func(a, c) = a *% 31 +% c.toNat32()),
      func(a, c) = a *% 31 +% c.toNat32(),
    );
    let suffix = (seed % 9000 + 1000).toText();
    let code = prefix # "-" # suffix;
    // 6-char alphanumeric link token
    let linkSeed : Nat32 = seed *% 1_000_003 +% 7;
    let chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let linkToken = Text.fromIter(
      [0,1,2,3,4,5].vals() |> _.map(func(i : Nat) : Char {
        let idx = ((linkSeed +% Nat32.fromNat(i * 6173)) % 36).toNat();
        chars.chars().drop(idx).next() |> (switch _ { case (?c) c; case null 'x' });
      })
    );
    let link = "develvyn.app/join/" # linkToken;
    let now = Time.now();
    let record : Common.InviteRecord = {
      role        = mappedRole;
      apartmentId = user.apartmentId;
      flatId      = switch (flatId) { case null null; case (?f) switch (Nat.fromText(f)) { case (?n) ?n; case null null } };
      createdAt   = now;
      expiresAt   = now + expiryNs;
      var used    = false;
      inviteLink  = link;
    };
    inviteCodes.add(code, record);
    #ok({ code; link; expiresAt = record.expiresAt });
  };

  // ── Validate an invite code without consuming it ───────────────────────────
  public shared query func validateInviteCode(
    code : Text,
  ) : async Common.Result<{ role : Text; isValid : Bool }, Text> {
    let invite = switch (inviteCodes.get(code)) {
      case null return #err("Invite code not found. Please check the code and try again.");
      case (?i) i;
    };
    if (invite.used) return #err("This invite code has already been used.");
    if (Time.now() > invite.expiresAt) return #err("This code has expired. Ask your Super Admin to send a new one.");
    let roleText = switch (invite.role) {
      case (#SuperAdmin)       "SuperAdmin";
      case (#FlatAdmin)        "FlatAdmin";
      case (#FamilyMember)     "FamilyMember";
      case (#Watchman)         "Watchman";
      case (#WatchmanFamily)   "WatchmanFamily";
      case (#RotatingIncharge) "RotatingIncharge";
      case (#Guest)            "Guest";
      case (#Founder)          "Founder";
      case (#CoFounder)        "CoFounder";
      case (#Employee)         "Employee";
      case (#Freelancer)       "Freelancer";
      case (#Contractor)       "Contractor";
    };
    #ok({ role = roleText; isValid = true });
  };

  // Get current user profile
  public shared query ({ caller }) func getMyProfile() : async ?AuthTypes.User {
    AuthLib.getUser(users, caller);
  };

  // Assign a role to a user (SuperAdmin only)
  public shared ({ caller }) func assignRole(
    target : Principal,
    role   : Common.Role,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    AuthLib.assignRole(users, target, role);
  };

  // Deactivate a user (SuperAdmin only)
  public shared ({ caller }) func deactivateUser(
    target : Principal,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    AuthLib.deactivateUser(users, target);
  };

  // Get all users for an apartment (SuperAdmin only)
  public shared query ({ caller }) func getApartmentUsers(
    apartmentId : Common.ApartmentId,
  ) : async [AuthTypes.User] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    AuthLib.getUsersForApartment(users, apartmentId);
  };
}
