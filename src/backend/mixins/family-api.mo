import FTypes "../types/family";
import MTypes "../types/maintenance";
import NTypes "../types/notices";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import FamilyLib "../lib/family";
import AuthLib "../lib/auth";
import Common "../types/common";

// All family data is scoped to caller's principal — never cross-family
mixin (
  familyExpenses   : Map.Map<Nat, FTypes.FamilyExpense>,
  familyTasks      : Map.Map<Nat, FTypes.FamilyTask>,
  groceryItems     : Map.Map<Nat, FTypes.GroceryItem>,
  calendarEvents   : Map.Map<Nat, FTypes.FamilyCalendarEvent>,
  billSubscriptions: Map.Map<Nat, FTypes.BillSubscription>,
  healthRecords    : Map.Map<Nat, FTypes.HealthRecord>,
  documentVault    : Map.Map<Nat, FTypes.DocumentVaultEntry>,
  familyReminders  : Map.Map<Nat, FTypes.FamilyReminder>,
  familyContacts   : Map.Map<Nat, FTypes.FamilyContact>,
  familyIdCounter  : { var next : Nat },
  users            : Map.Map<Principal, AuthTypes.User>,
  payments         : Map.Map<Nat, MTypes.MaintenancePayment>,
  notices          : Map.Map<Nat, NTypes.Notice>,
) {
  // Watchman access guard — returns #err if caller is Watchman or WatchmanFamily
  func guardNotWatchman(caller : Principal) : ?Common.Result<Text, Text> {
    switch (users.get(caller)) {
      case (?u) {
        switch (u.role) {
          case (#Watchman or #WatchmanFamily) return ?(#err("Access denied"));
          case _ return null;
        };
      };
      case null return null;
    };
  };
  // ── Cross-mode reads ──────────────────────────────────────────────────

  // Returns maintenance payments for the caller's own flat (Family Mode)
  public shared query ({ caller }) func getMyMaintenancePayments() : async [MTypes.MaintenancePayment] {
    let user = switch (users.get(caller)) {
      case null return [];
      case (?u) u;
    };
    switch (user.role) {
      case (#Watchman or #WatchmanFamily) return [];
      case _ {};
    };
    let flatId = switch (user.flatId) {
      case null return [];
      case (?f) f;
    };
    var result : [MTypes.MaintenancePayment] = [];
    payments.forEach(func(_, p) {
      if (p.flatId == flatId) { result := result.concat([p]) };
    });
    result;
  };

  // Returns apartment notices as read-only (cross-mode sync for Family Mode)
  public shared query ({ caller }) func getNoticesForFamily() : async [NTypes.Notice] {
    let user = switch (users.get(caller)) {
      case null return [];
      case (?u) u;
    };
    switch (user.role) {
      case (#Watchman or #WatchmanFamily) return [];
      case _ {};
    };
    let aptId = switch (user.apartmentId) {
      case null return [];
      case (?a) a;
    };
    var result : [NTypes.Notice] = [];
    notices.forEach(func(_, n) {
      if (n.apartmentId == aptId) { result := result.concat([n]) };
    });
    result;
  };

  // ── Expenses ──────────────────────────────────────────────────────────
  public shared ({ caller }) func addFamilyExpense(
    amount      : Nat,
    category    : FTypes.FamilyExpenseCategory,
    description : Text,
    date        : FTypes.Timestamp,
  ) : async { #ok : Text; #err : Text } {
    switch (guardNotWatchman(caller)) { case (?e) return e; case null {} };
    FamilyLib.addExpense(familyExpenses, familyIdCounter, caller, amount, category, description, date);
  };

  public shared ({ caller }) func updateFamilyExpense(
    id          : Nat,
    amount      : Nat,
    category    : FTypes.FamilyExpenseCategory,
    description : Text,
    date        : FTypes.Timestamp,
  ) : async { #ok : Text; #err : Text } {
    switch (guardNotWatchman(caller)) { case (?e) return e; case null {} };
    FamilyLib.updateExpense(familyExpenses, caller, id, amount, category, description, date);
  };

  public shared ({ caller }) func deleteFamilyExpense(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    switch (guardNotWatchman(caller)) { case (?e) return e; case null {} };
    FamilyLib.deleteExpense(familyExpenses, caller, id);
  };

  public shared query ({ caller }) func listFamilyExpenses() : async [FTypes.FamilyExpense] {
    switch (guardNotWatchman(caller)) { case (?_) return []; case null {} };
    FamilyLib.listExpenses(familyExpenses, caller);
  };

  // ── Tasks ──────────────────────────────────────────────────────────────
  public shared ({ caller }) func addFamilyTask(
    title       : Text,
    description : Text,
    assignedTo  : Text,
    dueDate     : ?FTypes.Timestamp,
    priority    : FTypes.TaskPriority,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addTask(familyTasks, familyIdCounter, caller, title, description, assignedTo, dueDate, priority);
  };

  public shared ({ caller }) func updateFamilyTask(
    id          : Nat,
    title       : Text,
    description : Text,
    assignedTo  : Text,
    dueDate     : ?FTypes.Timestamp,
    status      : FTypes.TaskStatus,
    priority    : FTypes.TaskPriority,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.updateTask(familyTasks, caller, id, title, description, assignedTo, dueDate, status, priority);
  };

  public shared ({ caller }) func deleteFamilyTask(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteTask(familyTasks, caller, id);
  };

  public shared query ({ caller }) func listFamilyTasks() : async [FTypes.FamilyTask] {
    FamilyLib.listTasks(familyTasks, caller);
  };

  // ── Grocery ────────────────────────────────────────────────────────────
  public shared ({ caller }) func addGroceryItem(
    name     : Text,
    quantity : Text,
    unit     : Text,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addGroceryItem(groceryItems, familyIdCounter, caller, name, quantity, unit);
  };

  public shared ({ caller }) func updateGroceryItem(
    id          : Nat,
    name        : Text,
    quantity    : Text,
    unit        : Text,
    isPurchased : Bool,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.updateGroceryItem(groceryItems, caller, id, name, quantity, unit, isPurchased);
  };

  public shared ({ caller }) func deleteGroceryItem(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteGroceryItem(groceryItems, caller, id);
  };

  public shared query ({ caller }) func listGroceryItems() : async [FTypes.GroceryItem] {
    FamilyLib.listGroceryItems(groceryItems, caller);
  };

  // ── Calendar Events ────────────────────────────────────────────────────
  public shared ({ caller }) func addCalendarEvent(
    title       : Text,
    description : Text,
    date        : FTypes.Timestamp,
    time        : Text,
    reminder    : ?FTypes.Timestamp,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addCalendarEvent(calendarEvents, familyIdCounter, caller, title, description, date, time, reminder);
  };

  public shared ({ caller }) func deleteCalendarEvent(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteCalendarEvent(calendarEvents, caller, id);
  };

  public shared query ({ caller }) func listCalendarEvents() : async [FTypes.FamilyCalendarEvent] {
    FamilyLib.listCalendarEvents(calendarEvents, caller);
  };

  // ── Bill Subscriptions ─────────────────────────────────────────────────
  public shared ({ caller }) func addBillSubscription(
    name     : Text,
    amount   : Nat,
    dueDay   : Nat,
    category : FTypes.BillCategory,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addBillSubscription(billSubscriptions, familyIdCounter, caller, name, amount, dueDay, category);
  };

  public shared ({ caller }) func updateBillSubscription(
    id       : Nat,
    name     : Text,
    amount   : Nat,
    dueDay   : Nat,
    category : FTypes.BillCategory,
    isActive : Bool,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.updateBillSubscription(billSubscriptions, caller, id, name, amount, dueDay, category, isActive);
  };

  public shared ({ caller }) func deleteBillSubscription(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteBillSubscription(billSubscriptions, caller, id);
  };

  public shared query ({ caller }) func listBillSubscriptions() : async [FTypes.BillSubscription] {
    FamilyLib.listBillSubscriptions(billSubscriptions, caller);
  };

  // ── Health Records ─────────────────────────────────────────────────────
  public shared ({ caller }) func addHealthRecord(
    memberName  : Text,
    recordType  : FTypes.HealthRecordType,
    title       : Text,
    note        : Text,
    date        : FTypes.Timestamp,
    fileUrl     : Text,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addHealthRecord(healthRecords, familyIdCounter, caller, memberName, recordType, title, note, date, fileUrl);
  };

  public shared ({ caller }) func deleteHealthRecord(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteHealthRecord(healthRecords, caller, id);
  };

  public shared query ({ caller }) func listHealthRecords() : async [FTypes.HealthRecord] {
    FamilyLib.listHealthRecords(healthRecords, caller);
  };

  // ── Document Vault ─────────────────────────────────────────────────────
  public shared ({ caller }) func addDocument(
    title   : Text,
    docType : FTypes.DocumentType,
    note    : Text,
    fileUrl : Text,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addDocument(documentVault, familyIdCounter, caller, title, docType, note, fileUrl);
  };

  public shared ({ caller }) func deleteDocument(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteDocument(documentVault, caller, id);
  };

  public shared query ({ caller }) func listDocuments() : async [FTypes.DocumentVaultEntry] {
    FamilyLib.listDocuments(documentVault, caller);
  };

  // ── Reminders ─────────────────────────────────────────────────────────
  public shared ({ caller }) func addReminder(
    title      : Text,
    date       : FTypes.Timestamp,
    time       : Text,
    repeatType : FTypes.RepeatType,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addReminder(familyReminders, familyIdCounter, caller, title, date, time, repeatType);
  };

  public shared ({ caller }) func deleteReminder(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteReminder(familyReminders, caller, id);
  };

  public shared query ({ caller }) func listReminders() : async [FTypes.FamilyReminder] {
    FamilyLib.listReminders(familyReminders, caller);
  };

  // ── Contacts ──────────────────────────────────────────────────────────
  public shared ({ caller }) func addFamilyContact(
    name     : Text,
    phone    : Text,
    relation : Text,
    note     : Text,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.addContact(familyContacts, familyIdCounter, caller, name, phone, relation, note);
  };

  public shared ({ caller }) func updateFamilyContact(
    id       : Nat,
    name     : Text,
    phone    : Text,
    relation : Text,
    note     : Text,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.updateContact(familyContacts, caller, id, name, phone, relation, note);
  };

  public shared ({ caller }) func deleteFamilyContact(
    id : Nat,
  ) : async { #ok : Text; #err : Text } {
    FamilyLib.deleteContact(familyContacts, caller, id);
  };

  public shared query ({ caller }) func listFamilyContacts() : async [FTypes.FamilyContact] {
    FamilyLib.listContacts(familyContacts, caller);
  };
}
