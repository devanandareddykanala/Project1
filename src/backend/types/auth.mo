import Common "common";
module {
  public type UserId    = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type Role      = Common.Role;

  public type User = {
    id          : UserId;
    principal   : Principal;
    name        : Text;
    phone       : Text;
    role        : Role;
    flatId      : ?Common.FlatId;
    apartmentId : ?Common.ApartmentId;
    createdAt   : Timestamp;
    isActive    : Bool;
  };

  public type Session = {
    principal : Principal;
    role      : Role;
    expiresAt : Timestamp;
  };

  public type WatchmanStatus = { #Pending; #Approved; #Rejected };

  public type WatchmanIdType = { #Aadhaar; #VoterID; #DrivingLicence; #Passport; #Other };

  public type PendingWatchman = {
    principal       : Principal;
    userId          : Text;
    name            : Text;
    phone           : Text;
    docUrl          : Text;          // image reference (object-storage URL)
    docType         : WatchmanIdType;
    uploadedAt      : Int;           // upload timestamp
    submittedAt     : Int;
    apartmentId     : Text;
    status          : WatchmanStatus;
    rejectionReason : ?Text;
  };

  // Profile returned to frontend after II login
  public type ProfileInfo = {
    userId      : Text;
    name        : Text;
    role        : Text;
    apartmentId : Text;
    flatId      : ?Text;
    isActive    : Bool;
  };
}
