import Time "mo:core/Time";
import Common "../types/common";
import ETypes "../types/expenses";
import Map "mo:core/Map";

module {
  // Create an apartment expense
  public func createExpense(
    expenses    : Map.Map<Nat, ETypes.ApartmentExpense>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    amount      : Nat,
    category    : ETypes.ExpenseCategory,
    description : Text,
    payee       : Text,
    _createdBy  : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let expense : ETypes.ApartmentExpense = {
      id;
      apartmentId;
      amount;
      category;
      description;
      payee;
      approvedBy = [];
      status = #Pending;
      createdAt = Time.now();
    };
    expenses.add(id, expense);
    #ok("Expense created with id " # debug_show(id));
  };

  // Approve an expense (FlatAdmin)
  public func approveExpense(
    expenses   : Map.Map<Nat, ETypes.ApartmentExpense>,
    expenseId  : Nat,
    approverId : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (expenses.get(expenseId)) {
      case null #err("Expense not found");
      case (?exp) {
        let alreadyApproved = exp.approvedBy.find(func(id : Common.UserId) : Bool { id == approverId });
        switch (alreadyApproved) {
          case (?_) #err("Already approved by this user");
          case null {
            let newApprovedBy = exp.approvedBy.concat([approverId]);
            let newStatus : ETypes.ExpenseStatus = if (newApprovedBy.size() >= 2 or exp.amount <= 2000) #Approved else exp.status;
            expenses.add(expenseId, { exp with approvedBy = newApprovedBy; status = newStatus });
            #ok("Expense approved");
          };
        };
      };
    };
  };

  // Mark expense as deducted (SuperAdmin)
  public func deductExpense(
    expenses   : Map.Map<Nat, ETypes.ApartmentExpense>,
    _wallet    : Map.Map<Nat, ETypes.ApartmentExpense>,
    expenseId  : Nat,
    _deductedBy : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (expenses.get(expenseId)) {
      case null #err("Expense not found");
      case (?exp) {
        switch (exp.status) {
          case (#Approved) {
            expenses.add(expenseId, { exp with status = #Deducted });
            #ok("Expense deducted");
          };
          case _ #err("Expense must be approved before deduction");
        };
      };
    };
  };

  // Get all expenses for an apartment
  public func getExpenses(
    expenses    : Map.Map<Nat, ETypes.ApartmentExpense>,
    apartmentId : Common.ApartmentId,
  ) : [ETypes.ApartmentExpense] {
    var result : [ETypes.ApartmentExpense] = [];
    for ((_, e) in expenses.entries()) {
      if (e.apartmentId == apartmentId) {
        result := result.concat([e]);
      };
    };
    result;
  };
}
