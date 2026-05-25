import Time "mo:core/Time";
import Common "../types/common";
import WTypes "../types/watchman";
import Map "mo:core/Map";

module {
  // Update facility status
  public func updateFacilityStatus(
    facilityMap : Map.Map<Common.ApartmentId, WTypes.FacilityStatus>,
    apartmentId : Common.ApartmentId,
    gate        : WTypes.GateStatus,
    waterMotor  : WTypes.WaterMotorStatus,
    lift        : WTypes.LiftStatus,
    cleaning    : WTypes.CleaningStatus,
    updatedBy   : Common.UserId,
  ) : Common.Result<Text, Text> {
    let status : WTypes.FacilityStatus = {
      apartmentId;
      gateStatus = gate;
      waterMotorStatus = waterMotor;
      liftStatus = lift;
      cleaningStatus = cleaning;
      lastUpdatedBy = updatedBy;
      lastUpdatedAt = Time.now();
    };
    facilityMap.add(apartmentId, status);
    #ok("Facility status updated");
  };

  // Get current facility status
  public func getFacilityStatus(
    facilityMap : Map.Map<Common.ApartmentId, WTypes.FacilityStatus>,
    apartmentId : Common.ApartmentId,
  ) : ?WTypes.FacilityStatus {
    facilityMap.get(apartmentId);
  };

  // Start a watchman shift
  public func startShift(
    shifts      : Map.Map<Nat, WTypes.WatchmanShift>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    watchmanId  : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let shift : WTypes.WatchmanShift = {
      id;
      apartmentId;
      watchmanId;
      startedAt = Time.now();
      endedAt = null;
      isNightMode = false;
      handoverNote = "";
      handoverChecklist = {
        gateChecked = false;
        motorChecked = false;
        liftChecked = false;
      };
      relievedById = null;
    };
    shifts.add(id, shift);
    #ok("Shift started with id " # debug_show(id));
  };

  // End a shift with handover checklist
  public func endShift(
    shifts    : Map.Map<Nat, WTypes.WatchmanShift>,
    shiftId   : Nat,
    note      : Text,
    checklist : WTypes.ShiftHandoverChecklist,
  ) : Common.Result<Text, Text> {
    switch (shifts.get(shiftId)) {
      case null #err("Shift not found");
      case (?s) {
        shifts.add(shiftId, { s with endedAt = ?Time.now(); handoverNote = note; handoverChecklist = checklist });
        #ok("Shift ended");
      };
    };
  };

  // Get active shift for apartment (no endedAt)
  public func getActiveShift(
    shifts      : Map.Map<Nat, WTypes.WatchmanShift>,
    apartmentId : Common.ApartmentId,
  ) : ?WTypes.WatchmanShift {
    for ((_, s) in shifts.entries()) {
      if (s.apartmentId == apartmentId) {
        switch (s.endedAt) {
          case null return ?s;
          case _ {};
        };
      };
    };
    null;
  };

  // Get full shift history
  public func getShiftHistory(
    shifts      : Map.Map<Nat, WTypes.WatchmanShift>,
    apartmentId : Common.ApartmentId,
  ) : [WTypes.WatchmanShift] {
    var result : [WTypes.WatchmanShift] = [];
    for ((_, s) in shifts.entries()) {
      if (s.apartmentId == apartmentId) {
        result := result.concat([s]);
      };
    };
    result;
  };

  // Toggle night mode on a shift
  public func setNightMode(
    shifts  : Map.Map<Nat, WTypes.WatchmanShift>,
    shiftId : Nat,
    enabled : Bool,
  ) : Common.Result<Text, Text> {
    switch (shifts.get(shiftId)) {
      case null #err("Shift not found");
      case (?s) {
        shifts.add(shiftId, { s with isNightMode = enabled });
        #ok("Night mode updated");
      };
    };
  };
}
