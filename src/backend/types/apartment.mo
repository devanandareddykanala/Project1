import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type FlatId      = Common.FlatId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type Apartment = {
    id                 : ApartmentId;
    name               : Text;
    address            : Text;
    superAdminId       : UserId;
    inchargeId         : ?UserId;
    upiId              : Text;
    upiQrData          : Text;
    createdAt          : Timestamp;
    subscriptionStatus : Common.SubscriptionStatus;
  };

  public type FlatStatus = { #Occupied; #Vacant };

  public type Flat = {
    id          : FlatId;
    apartmentId : ApartmentId;
    flatNumber  : Text;
    ownerId     : ?UserId;
    tenantId    : ?UserId;
    status      : FlatStatus;
  };

  // Incharge rotation
  public type HandoverChecklist = {
    gateKeyTransferred  : Bool;
    ledgerReviewed      : Bool;
    upiUpdated          : Bool;
    pendingIssuesNoted  : Bool;
  };

  public type InchargeRecord = {
    id               : Nat;
    apartmentId      : ApartmentId;
    userId           : UserId;
    startDate        : Timestamp;
    endDate          : ?Timestamp;
    handoverNotes    : Text;
    handoverChecklist: HandoverChecklist;
    isActive         : Bool;
  };
}
