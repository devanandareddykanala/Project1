import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type FlatId      = Common.FlatId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type VisitorType = { #Delivery; #Guest; #Service; #Unknown };

  public type VisitorEntry = {
    id          : Nat;
    apartmentId : ApartmentId;
    flatId      : ?FlatId;
    visitorName : Text;
    visitorType : VisitorType;
    note        : Text;
    enteredBy   : UserId;
    enteredAt   : Timestamp;
  };
}
