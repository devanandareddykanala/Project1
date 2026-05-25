import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type FlatId      = Common.FlatId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type AlertType = { #Medical; #Fire; #Safety; #Other };

  public type SOSAlert = {
    id               : Nat;
    apartmentId      : ApartmentId;
    flatId           : FlatId;
    alertType        : AlertType;
    triggeredBy      : UserId;
    triggeredAt      : Timestamp;
    respondedBy      : ?UserId;
    respondedAt      : ?Timestamp;
    resolvedBy       : ?UserId;
    resolvedAt       : ?Timestamp;
    resolutionNote   : Text;
    isFalseAlarm     : Bool;
    falseAlarmReason : Text;
  };
}
