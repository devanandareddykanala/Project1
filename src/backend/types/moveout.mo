// Move-in / move-out types
module {
  public type ChecklistEntry = {
    item      : Text;
    completed : Bool;
  };

  public type MoveOutChecklist = {
    flatId      : Text;
    items       : [ChecklistEntry];
    initiatedAt : Int;
    completedAt : ?Int;
  };
}
