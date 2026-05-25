import Debug "mo:core/Debug";
import Common "../types/common";
import AptTypes "../types/apartment";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import ApartmentLib "../lib/apartment";

mixin (
  users           : Map.Map<Principal, AuthTypes.User>,
  apartments      : Map.Map<Common.ApartmentId, AptTypes.Apartment>,
  flats           : Map.Map<Common.FlatId, AptTypes.Flat>,
  inchargeRecords : Map.Map<Nat, AptTypes.InchargeRecord>,
  aptIdCounter    : { var next : Nat },
  flatIdCounter   : { var next : Nat },
  inchargeIdCounter : { var next : Nat },
) {
  // Create apartment (open — first caller becomes SuperAdmin)
  public shared ({ caller }) func createApartment(
    name    : Text,
    address : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.registerUser(users, aptIdCounter, caller, "", "", #SuperAdmin, null, null);
    ApartmentLib.createApartment(apartments, aptIdCounter, name, address, user.id);
  };

  // Update UPI details (SuperAdmin / Incharge)
  public shared ({ caller }) func updateApartmentUpi(
    apartmentId : Common.ApartmentId,
    upiId       : Text,
    upiQrData   : Text,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    ApartmentLib.updateUpi(apartments, apartmentId, upiId, upiQrData);
  };

  // Get apartment details
  public shared query ({ caller }) func getApartment(
    apartmentId : Common.ApartmentId,
  ) : async ?AptTypes.Apartment {
    ApartmentLib.getApartment(apartments, apartmentId);
  };

  // Create a flat
  public shared ({ caller }) func createFlat(
    apartmentId : Common.ApartmentId,
    flatNumber  : Text,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    ApartmentLib.createFlat(flats, flatIdCounter, apartmentId, flatNumber);
  };

  // Get all flats for an apartment
  public shared query ({ caller }) func getFlats(
    apartmentId : Common.ApartmentId,
  ) : async [AptTypes.Flat] {
    ApartmentLib.getFlats(flats, apartmentId);
  };

  // Assign incharge (SuperAdmin only)
  public shared ({ caller }) func assignIncharge(
    apartmentId : Common.ApartmentId,
    userId      : Common.UserId,
    startDate   : Common.Timestamp,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    ApartmentLib.assignIncharge(apartments, inchargeRecords, inchargeIdCounter, apartmentId, userId, startDate);
  };

  // Initiate handover (current Incharge)
  public shared ({ caller }) func initiateHandover(
    apartmentId : Common.ApartmentId,
    notes       : Text,
    checklist   : AptTypes.HandoverChecklist,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#RotatingIncharge, #SuperAdmin]);
    ApartmentLib.initiateHandover(inchargeRecords, apartmentId, notes, checklist);
  };

  // Accept handover (new Incharge)
  public shared ({ caller }) func acceptHandover(
    apartmentId   : Common.ApartmentId,
    newInchargeId : Common.UserId,
  ) : async Common.Result<Text, Text> {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin]);
    ApartmentLib.acceptHandover(apartments, inchargeRecords, inchargeIdCounter, apartmentId, newInchargeId);
  };

  // Get incharge history
  public shared query ({ caller }) func getInchargeHistory(
    apartmentId : Common.ApartmentId,
  ) : async [AptTypes.InchargeRecord] {
    ApartmentLib.getInchargeHistory(inchargeRecords, apartmentId);
  };
}
