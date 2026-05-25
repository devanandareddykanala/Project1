import Debug "mo:core/Debug";
import Common "../types/common";
import STypes "../types/sos";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import SosLib "../lib/sos";

mixin (
  users     : Map.Map<Principal, AuthTypes.User>,
  alerts    : Map.Map<Nat, STypes.SOSAlert>,
  sosIdCounter : { var next : Nat },
) {
  // Trigger SOS (any resident)
  public shared ({ caller }) func triggerSOS(
    flatId      : Common.FlatId,
    apartmentId : Common.ApartmentId,
    alertType   : STypes.AlertType,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest]);
    SosLib.triggerSOS(alerts, sosIdCounter, apartmentId, flatId, alertType, user.id);
  };

  // Watchman responds to SOS
  public shared ({ caller }) func respondToSOS(
    sosId : Nat,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#Watchman, #WatchmanFamily, #SuperAdmin]);
    SosLib.respondToSOS(alerts, sosId, user.id);
  };

  // Resolve SOS
  public shared ({ caller }) func resolveSOS(
    sosId            : Nat,
    note             : Text,
    isFalseAlarm     : Bool,
    falseAlarmReason : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#Watchman, #WatchmanFamily, #SuperAdmin, #RotatingIncharge]);
    SosLib.resolveSOS(alerts, sosId, user.id, note, isFalseAlarm, falseAlarmReason);
  };

  // Get SOS log (SuperAdmin only — permanent)
  public shared query ({ caller }) func getSOSLog(
    apartmentId : Common.ApartmentId,
  ) : async [STypes.SOSAlert] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    SosLib.getSOSLog(alerts, apartmentId);
  };
}
