// Guest / temporary access types
module {
  public type GuestRecord = {
    id        : Text;
    flatId    : Text;
    name      : Text;
    phone     : Text;
    createdAt : Int;
    expiresAt : Int;
    isActive  : Bool;
  };
}
