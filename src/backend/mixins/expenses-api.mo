import Debug "mo:core/Debug";
import Common "../types/common";
import ETypes "../types/expenses";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import ExpensesLib "../lib/expenses";

mixin (
  users     : Map.Map<Principal, AuthTypes.User>,
  expenses  : Map.Map<Nat, ETypes.ApartmentExpense>,
  expIdCounter : { var next : Nat },
) {
  // Create an apartment expense
  public shared ({ caller }) func createExpense(
    apartmentId : Common.ApartmentId,
    amount      : Nat,
    category    : ETypes.ExpenseCategory,
    description : Text,
    payee       : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    ExpensesLib.createExpense(expenses, expIdCounter, apartmentId, amount, category, description, payee, user.id);
  };

  // Approve an expense (FlatAdmin)
  public shared ({ caller }) func approveExpense(
    expenseId : Nat,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#FlatAdmin, #SuperAdmin]);
    ExpensesLib.approveExpense(expenses, expenseId, user.id);
  };

  // Deduct expense from wallet (SuperAdmin — 2 approvals required for > Rs 2000)
  public shared ({ caller }) func deductExpense(
    expenseId : Nat,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    ExpensesLib.deductExpense(expenses, expenses, expenseId, user.id);
  };

  // Get all expenses for an apartment
  public shared query ({ caller }) func getExpenses(
    apartmentId : Common.ApartmentId,
  ) : async [ETypes.ApartmentExpense] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #RotatingIncharge]);
    ExpensesLib.getExpenses(expenses, apartmentId);
  };
}
