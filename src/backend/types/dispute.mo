// Dispute resolution types
module {
  public type DisputeNote = {
    author  : Text;
    note    : Text;
    addedAt : Int;
  };

  public type DisputeRecord = {
    id          : Text;
    flatId      : Text;
    category    : Text;
    description : Text;
    status      : Text;
    tier        : Nat;
    createdAt   : Int;
    notes       : [DisputeNote];
    resolvedAt  : ?Int;
    resolution  : ?Text;
  };
}
