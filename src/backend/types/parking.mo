import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type FlatId      = Common.FlatId;
  public type Timestamp   = Common.Timestamp;

  public type ParkingType = { #Car; #Bike; #Both };

  public type ParkingSlot = {
    id          : Nat;
    apartmentId : ApartmentId;
    slotNumber  : Text;
    slotType    : ParkingType;
    assignedTo  : ?FlatId;
    assignedAt  : ?Timestamp;
  };
}
