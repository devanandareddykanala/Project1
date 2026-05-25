import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type Priority = { #Normal; #Important; #Urgent };

  public type Notice = {
    id             : Nat;
    apartmentId    : ApartmentId;
    title          : Text;
    content        : Text;
    postedBy       : UserId;
    postedAt       : Timestamp;
    priority       : Priority;
    acknowledgedBy : [UserId];
  };
}
