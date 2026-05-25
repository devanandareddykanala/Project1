import Common "common";
module {
  public type FlatId      = Common.FlatId;
  public type ApartmentId = Common.ApartmentId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type PaymentStatus = { #Pending; #Verified; #Rejected };

  public type MaintenancePayment = {
    id            : Nat;
    flatId        : FlatId;
    apartmentId   : ApartmentId;
    amount        : Nat;
    month         : Nat;  // 1–12
    year          : Nat;
    utrNumber     : Text;
    screenshotUrl : Text;
    status        : PaymentStatus;
    verifiedBy    : ?UserId;
    createdAt     : Timestamp;
    // Correction chain — each entry optionally links to the original
    correctionOf  : ?Nat;   // id of original entry this corrects
    correctionNote: ?Text;
  };

  // Wallet
  public type WalletEntryType = { #Credit; #Debit; #Correction };
  public type DebitApprovalStatus = { #Pending; #Approved; #Rejected; #Executed };

  public type WalletEntry = {
    id            : Nat;
    apartmentId   : ApartmentId;
    entryType     : WalletEntryType;
    amount        : Nat;
    flatId        : ?FlatId;
    purpose       : Text;
    utrNumber     : ?Text;
    approvedBy    : [UserId];  // flat admins who approved debit
    status        : DebitApprovalStatus;
    createdAt     : Timestamp;
    isPermanent   : Bool;
    correctionOf  : ?Nat;   // id of original entry this corrects
    correctionNote: ?Text;
  };
}
