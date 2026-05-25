// Cross-cutting types shared across all domains
module {
  public type UserId = Nat;
  public type ApartmentId = Nat;
  public type FlatId = Nat;
  public type Timestamp = Int;

  public type Result<T, E> = { #ok : T; #err : E };

  public type Role = {
    #SuperAdmin;
    #FlatAdmin;
    #FamilyMember;
    #Watchman;
    #WatchmanFamily;
    #RotatingIncharge;
    #Guest;
    #Founder;
    #CoFounder;
    #Employee;
    #Freelancer;
    #Contractor;
  };

  public type SubscriptionStatus = {
    #Active;
    #Inactive;
    #GracePeriod;
    #Trial;
    #Overdue;
  };

  // Invite code metadata stored by code string
  public type InviteRecord = {
    role        : Role;
    apartmentId : ?ApartmentId;
    flatId      : ?FlatId;
    createdAt   : Int;
    expiresAt   : Int;   // absolute ns timestamp
    var used    : Bool;
    inviteLink  : Text;  // develvyn.app/join/<6-char>
  };
}
