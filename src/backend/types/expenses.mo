import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type ExpenseCategory = {
    #Maintenance;
    #Salary;
    #Utilities;
    #Repair;
    #Other;
  };

  public type ExpenseStatus = { #Pending; #Approved; #Deducted };

  public type ApartmentExpense = {
    id          : Nat;
    apartmentId : ApartmentId;
    amount      : Nat;
    category    : ExpenseCategory;
    description : Text;
    payee       : Text;
    approvedBy  : [UserId];
    status      : ExpenseStatus;
    createdAt   : Timestamp;
  };
}
