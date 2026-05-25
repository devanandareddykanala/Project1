import Runtime "mo:core/Runtime";
import Common "../types/common";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";

module {
  // Role equality helper
  func roleEqual(a : Common.Role, b : Common.Role) : Bool {
    switch (a, b) {
      case (#SuperAdmin, #SuperAdmin) true;
      case (#FlatAdmin, #FlatAdmin) true;
      case (#FamilyMember, #FamilyMember) true;
      case (#Watchman, #Watchman) true;
      case (#WatchmanFamily, #WatchmanFamily) true;
      case (#RotatingIncharge, #RotatingIncharge) true;
      case (#Guest, #Guest) true;
      case (#Founder, #Founder) true;
      case (#CoFounder, #CoFounder) true;
      case (#Employee, #Employee) true;
      case (#Freelancer, #Freelancer) true;
      case (#Contractor, #Contractor) true;
      case _ false;
    };
  };

  public func roleToText(role : Common.Role) : Text {
    switch (role) {
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
  };

  // Convert internal User to public ProfileInfo
  public func toProfileInfo(u : AuthTypes.User) : AuthTypes.ProfileInfo {
    {
      userId      = u.id.toText();
      name        = u.name;
      role        = roleToText(u.role);
      apartmentId = switch (u.apartmentId) { case (?id) id.toText(); case null "" };
      flatId      = switch (u.flatId) { case (?id) ?id.toText(); case null null };
      isActive    = u.isActive;
    };
  };

  // Register a new user (Internet Identity — phone optional)
  public func registerUser(
    users       : Map.Map<Principal, AuthTypes.User>,
    idCounter   : { var next : Nat },
    caller      : Principal,
    name        : Text,
    phone       : Text,
    role        : Common.Role,
    flatId      : ?Common.FlatId,
    apartmentId : ?Common.ApartmentId,
  ) : AuthTypes.User {
    switch (users.get(caller)) {
      case (?existing) {
        let updated = { existing with name; phone; role; flatId; apartmentId; isActive = true };
        users.add(caller, updated);
        updated;
      };
      case null {
        let id = idCounter.next;
        idCounter.next += 1;
        let user : AuthTypes.User = {
          id;
          principal = caller;
          name;
          phone;
          role;
          flatId;
          apartmentId;
          createdAt = 0;
          isActive = true;
        };
        users.add(caller, user);
        user;
      };
    };
  };

  // Get user by principal
  public func getUser(
    users  : Map.Map<Principal, AuthTypes.User>,
    caller : Principal,
  ) : ?AuthTypes.User {
    users.get(caller);
  };

  // Assert role — traps if unauthorized
  public func assertRole(
    users   : Map.Map<Principal, AuthTypes.User>,
    caller  : Principal,
    allowed : [Common.Role],
  ) : AuthTypes.User {
    let user = switch (users.get(caller)) {
      case (?u) u;
      case null Runtime.trap("User not found — please complete registration first");
    };
    if (not user.isActive) Runtime.trap("Your account is not active yet. Please wait for approval.");
    let ok = allowed.find(func(r : Common.Role) : Bool { roleEqual(r, user.role) });
    switch (ok) {
      case (?_) user;
      case null Runtime.trap("Access denied — you don't have permission for this action");
    };
  };

  // Update user role
  public func assignRole(
    users  : Map.Map<Principal, AuthTypes.User>,
    target : Principal,
    role   : Common.Role,
  ) : Common.Result<Text, Text> {
    switch (users.get(target)) {
      case null #err("Target user not found");
      case (?u) {
        users.add(target, { u with role });
        #ok("Role updated");
      };
    };
  };

  // Deactivate user
  public func deactivateUser(
    users  : Map.Map<Principal, AuthTypes.User>,
    target : Principal,
  ) : Common.Result<Text, Text> {
    switch (users.get(target)) {
      case null #err("User not found");
      case (?u) {
        users.add(target, { u with isActive = false });
        #ok("User deactivated");
      };
    };
  };

  // Get all users for an apartment
  public func getUsersForApartment(
    users       : Map.Map<Principal, AuthTypes.User>,
    apartmentId : Common.ApartmentId,
  ) : [AuthTypes.User] {
    var result : [AuthTypes.User] = [];
    for ((_, u) in users.entries()) {
      switch (u.apartmentId) {
        case (?aid) if (aid == apartmentId) { result := result.concat([u]) };
        case _ {};
      };
    };
    result;
  };

  // Generate a short alphanumeric link token (6 chars)
  public func makeLinkToken(seed : Nat32) : Text {
    let charsArr : [Char] = ['a','b','c','d','e','f','g','h','i','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z','2','3','4','5','6','7','8','9'];
    var s = "";
    var v = seed;
    for (_ in [0, 1, 2, 3, 4, 5].values()) {
      let idx = (v % 32).toNat();
      v := v / 32;
      s := s # Text.fromChar(charsArr[idx]);
    };
    s;
  };
}
