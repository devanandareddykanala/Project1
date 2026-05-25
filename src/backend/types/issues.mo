import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type FlatId      = Common.FlatId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type IssueCategory = {
    #Maintenance;
    #Security;
    #Common;
    #Electrical;
    #Plumbing;
    #Other;
  };

  public type IssueStatus = { #Open; #InProgress; #Resolved };

  public type Issue = {
    id          : Nat;
    apartmentId : ApartmentId;
    flatId      : FlatId;
    title       : Text;
    description : Text;
    category    : IssueCategory;
    status      : IssueStatus;
    raisedBy    : UserId;
    assignedTo  : ?UserId;
    resolvedAt  : ?Timestamp;
    createdAt   : Timestamp;
    updatedAt   : Timestamp;
  };
}
