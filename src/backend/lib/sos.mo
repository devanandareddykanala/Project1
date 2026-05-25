import Time "mo:core/Time";
import Common "../types/common";
import STypes "../types/sos";
import Map "mo:core/Map";

module {
  // Trigger an SOS alert
  public func triggerSOS(
    alerts      : Map.Map<Nat, STypes.SOSAlert>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    flatId      : Common.FlatId,
    alertType   : STypes.AlertType,
    triggeredBy : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let alert : STypes.SOSAlert = {
      id;
      apartmentId;
      flatId;
      alertType;
      triggeredBy;
      triggeredAt = Time.now();
      respondedBy = null;
      respondedAt = null;
      resolvedBy = null;
      resolvedAt = null;
      resolutionNote = "";
      isFalseAlarm = false;
      falseAlarmReason = "";
    };
    alerts.add(id, alert);
    #ok("SOS triggered with id " # debug_show(id));
  };

  // Watchman responds to SOS
  public func respondToSOS(
    alerts      : Map.Map<Nat, STypes.SOSAlert>,
    sosId       : Nat,
    respondedBy : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (alerts.get(sosId)) {
      case null #err("SOS not found");
      case (?a) {
        alerts.add(sosId, { a with respondedBy = ?respondedBy; respondedAt = ?Time.now() });
        #ok("Responded to SOS");
      };
    };
  };

  // Resolve SOS
  public func resolveSOS(
    alerts           : Map.Map<Nat, STypes.SOSAlert>,
    sosId            : Nat,
    resolvedBy       : Common.UserId,
    note             : Text,
    isFalseAlarm     : Bool,
    falseAlarmReason : Text,
  ) : Common.Result<Text, Text> {
    switch (alerts.get(sosId)) {
      case null #err("SOS not found");
      case (?a) {
        alerts.add(sosId, {
          a with
          resolvedBy = ?resolvedBy;
          resolvedAt = ?Time.now();
          resolutionNote = note;
          isFalseAlarm;
          falseAlarmReason;
        });
        #ok("SOS resolved");
      };
    };
  };

  // Get SOS log for apartment
  public func getSOSLog(
    alerts      : Map.Map<Nat, STypes.SOSAlert>,
    apartmentId : Common.ApartmentId,
  ) : [STypes.SOSAlert] {
    var result : [STypes.SOSAlert] = [];
    for ((_, a) in alerts.entries()) {
      if (a.apartmentId == apartmentId) {
        result := result.concat([a]);
      };
    };
    result;
  };
}
