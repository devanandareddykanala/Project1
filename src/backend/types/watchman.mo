import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type GateStatus       = { #Open; #Closed; #Locked };
  public type WaterMotorStatus = { #On; #Off };
  public type LiftStatus       = { #OK; #Issue; #Offline };
  public type CleaningStatus   = { #Done; #Pending };

  public type FacilityStatus = {
    apartmentId       : ApartmentId;
    gateStatus        : GateStatus;
    waterMotorStatus  : WaterMotorStatus;
    liftStatus        : LiftStatus;
    cleaningStatus    : CleaningStatus;
    lastUpdatedBy     : UserId;
    lastUpdatedAt     : Timestamp;
  };

  public type ShiftHandoverChecklist = {
    gateChecked  : Bool;
    motorChecked : Bool;
    liftChecked  : Bool;
  };

  public type WatchmanShift = {
    id           : Nat;
    apartmentId  : ApartmentId;
    watchmanId   : UserId;
    startedAt    : Timestamp;
    endedAt      : ?Timestamp;
    isNightMode  : Bool;
    handoverNote : Text;
    handoverChecklist : ShiftHandoverChecklist;
    relievedById : ?UserId;
  };
}
