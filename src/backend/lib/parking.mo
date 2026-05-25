import Time "mo:core/Time";
import Common "../types/common";
import PTypes "../types/parking";
import Map "mo:core/Map";

module {
  // Assign a parking slot to a flat
  public func assignParking(
    slots   : Map.Map<Nat, PTypes.ParkingSlot>,
    slotId  : Nat,
    flatId  : Common.FlatId,
  ) : Common.Result<Text, Text> {
    switch (slots.get(slotId)) {
      case null #err("Parking slot not found");
      case (?slot) {
        slots.add(slotId, { slot with assignedTo = ?flatId; assignedAt = ?Time.now() });
        #ok("Parking slot assigned");
      };
    };
  };

  // Unassign a parking slot
  public func unassignParking(
    slots  : Map.Map<Nat, PTypes.ParkingSlot>,
    slotId : Nat,
  ) : Common.Result<Text, Text> {
    switch (slots.get(slotId)) {
      case null #err("Parking slot not found");
      case (?slot) {
        slots.add(slotId, { slot with assignedTo = null; assignedAt = null });
        #ok("Parking slot unassigned");
      };
    };
  };

  // Get all parking slots for apartment
  public func getParkingSlots(
    slots       : Map.Map<Nat, PTypes.ParkingSlot>,
    apartmentId : Common.ApartmentId,
  ) : [PTypes.ParkingSlot] {
    var result : [PTypes.ParkingSlot] = [];
    for ((_, s) in slots.entries()) {
      if (s.apartmentId == apartmentId) {
        result := result.concat([s]);
      };
    };
    result;
  };
}
