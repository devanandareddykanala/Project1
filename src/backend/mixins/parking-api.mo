import Debug "mo:core/Debug";
import Common "../types/common";
import PTypes "../types/parking";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import ParkingLib "../lib/parking";

mixin (
  users     : Map.Map<Principal, AuthTypes.User>,
  slots     : Map.Map<Nat, PTypes.ParkingSlot>,
  slotIdCounter : { var next : Nat },
) {
  // Assign parking slot to flat (SuperAdmin)
  public shared ({ caller }) func assignParking(
    slotId : Nat,
    flatId : Common.FlatId,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    ParkingLib.assignParking(slots, slotId, flatId);
  };

  // Unassign parking slot (SuperAdmin)
  public shared ({ caller }) func unassignParking(
    slotId : Nat,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    ParkingLib.unassignParking(slots, slotId);
  };

  // Get all parking slots
  public shared query ({ caller }) func getParkingSlots(
    apartmentId : Common.ApartmentId,
  ) : async [PTypes.ParkingSlot] {
    ParkingLib.getParkingSlots(slots, apartmentId);
  };
}
