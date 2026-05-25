import Debug "mo:core/Debug";
import Common "../types/common";
import VTypes "../types/visitors";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import VisitorsLib "../lib/visitors";

mixin (
  users     : Map.Map<Principal, AuthTypes.User>,
  visitors  : Map.Map<Nat, VTypes.VisitorEntry>,
  visIdCounter : { var next : Nat },
) {
  // Log a visitor
  public shared ({ caller }) func logVisitor(
    flatId      : ?Common.FlatId,
    apartmentId : Common.ApartmentId,
    name        : Text,
    visitorType : VTypes.VisitorType,
    note        : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #Watchman, #WatchmanFamily, #RotatingIncharge]);
    VisitorsLib.logVisitor(visitors, visIdCounter, apartmentId, flatId, user.id, name, visitorType, note);
  };

  // Get visitor log (SA/Watchman: all; FlatAdmin: own flat)
  public shared query ({ caller }) func getVisitorLog(
    apartmentId : Common.ApartmentId,
  ) : async [VTypes.VisitorEntry] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #Watchman, #WatchmanFamily, #RotatingIncharge]);
    VisitorsLib.getVisitorLog(visitors, apartmentId, null);
  };

  // Cross-mode read: visitor log for own flat (Family Mode)
  public shared query ({ caller }) func getVisitorLogForFlat(
    flatId : Common.FlatId,
  ) : async [VTypes.VisitorEntry] {
    let user = AuthLib.assertRole(users, caller, [#FlatAdmin, #FamilyMember, #SuperAdmin, #RotatingIncharge]);
    let aptId = switch (user.apartmentId) {
      case (?aid) aid;
      case null 0;
    };
    VisitorsLib.getVisitorLog(visitors, aptId, ?flatId);
  };
}
