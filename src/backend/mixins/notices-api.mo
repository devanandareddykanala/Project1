import Debug "mo:core/Debug";
import Common "../types/common";
import NTypes "../types/notices";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import NoticesLib "../lib/notices";

mixin (
  users     : Map.Map<Principal, AuthTypes.User>,
  notices   : Map.Map<Nat, NTypes.Notice>,
  notIdCounter : { var next : Nat },
) {
  // Post a notice (SuperAdmin only)
  public shared ({ caller }) func postNotice(
    apartmentId : Common.ApartmentId,
    title       : Text,
    content     : Text,
    priority    : NTypes.Priority,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    NoticesLib.postNotice(notices, notIdCounter, apartmentId, title, content, priority, user.id);
  };

  // Acknowledge a notice
  public shared ({ caller }) func acknowledgeNotice(
    noticeId : Nat,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest]);
    NoticesLib.acknowledgeNotice(notices, noticeId, user.id);
  };

  // Get all notices
  public shared query ({ caller }) func getNotices(
    apartmentId : Common.ApartmentId,
  ) : async [NTypes.Notice] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest]);
    NoticesLib.getNotices(notices, apartmentId);
  };

  // Get unread count for caller
  public shared query ({ caller }) func getUnreadNoticeCount(
    apartmentId : Common.ApartmentId,
  ) : async Nat {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest]);
    NoticesLib.getUnreadCount(notices, apartmentId, user.id);
  };

  // Cross-mode read: notices for Family Mode (read-only)
  public shared query ({ caller }) func getNoticesForApartment(
    apartmentId : Common.ApartmentId,
  ) : async [NTypes.Notice] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest]);
    NoticesLib.getNotices(notices, apartmentId);
  };
}
