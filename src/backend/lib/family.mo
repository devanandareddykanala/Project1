import Time "mo:core/Time";
import FTypes "../types/family";
import Map "mo:core/Map";

module {
  // ── Expenses ──────────────────────────────────────────────────────────
  public func addExpense(
    expenses    : Map.Map<Nat, FTypes.FamilyExpense>,
    idCounter   : { var next : Nat },
    caller      : Principal,
    amount      : Nat,
    category    : FTypes.FamilyExpenseCategory,
    description : Text,
    date        : FTypes.Timestamp,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    let expense : FTypes.FamilyExpense = {
      id; principalId = caller; amount; category; description; date; createdAt = Time.now();
    };
    expenses.add(id, expense);
    #ok("Expense added");
  };

  public func updateExpense(
    expenses    : Map.Map<Nat, FTypes.FamilyExpense>,
    caller      : Principal,
    id          : Nat,
    amount      : Nat,
    category    : FTypes.FamilyExpenseCategory,
    description : Text,
    date        : FTypes.Timestamp,
  ) : { #ok : Text; #err : Text } {
    switch (expenses.get(id)) {
      case null #err("Not found");
      case (?e) {
        if (e.principalId != caller) return #err("Access denied");
        expenses.add(id, { e with amount; category; description; date });
        #ok("Updated");
      };
    };
  };

  public func deleteExpense(
    expenses : Map.Map<Nat, FTypes.FamilyExpense>,
    caller   : Principal,
    id       : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (expenses.get(id)) {
      case null #err("Not found");
      case (?e) {
        if (e.principalId != caller) return #err("Access denied");
        expenses.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listExpenses(
    expenses : Map.Map<Nat, FTypes.FamilyExpense>,
    caller   : Principal,
  ) : [FTypes.FamilyExpense] {
    var result : [FTypes.FamilyExpense] = [];
    for ((_, e) in expenses.entries()) {
      if (e.principalId == caller) result := result.concat([e]);
    };
    result;
  };

  // ── Tasks ──────────────────────────────────────────────────────────────
  public func addTask(
    tasks       : Map.Map<Nat, FTypes.FamilyTask>,
    idCounter   : { var next : Nat },
    caller      : Principal,
    title       : Text,
    description : Text,
    assignedTo  : Text,
    dueDate     : ?FTypes.Timestamp,
    priority    : FTypes.TaskPriority,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    tasks.add(id, { id; principalId = caller; title; description; assignedTo; dueDate; status = #Pending; priority; createdAt = Time.now() });
    #ok("Task added");
  };

  public func updateTask(
    tasks       : Map.Map<Nat, FTypes.FamilyTask>,
    caller      : Principal,
    id          : Nat,
    title       : Text,
    description : Text,
    assignedTo  : Text,
    dueDate     : ?FTypes.Timestamp,
    status      : FTypes.TaskStatus,
    priority    : FTypes.TaskPriority,
  ) : { #ok : Text; #err : Text } {
    switch (tasks.get(id)) {
      case null #err("Not found");
      case (?t) {
        if (t.principalId != caller) return #err("Access denied");
        tasks.add(id, { t with title; description; assignedTo; dueDate; status; priority });
        #ok("Updated");
      };
    };
  };

  public func deleteTask(
    tasks  : Map.Map<Nat, FTypes.FamilyTask>,
    caller : Principal,
    id     : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (tasks.get(id)) {
      case null #err("Not found");
      case (?t) {
        if (t.principalId != caller) return #err("Access denied");
        tasks.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listTasks(
    tasks  : Map.Map<Nat, FTypes.FamilyTask>,
    caller : Principal,
  ) : [FTypes.FamilyTask] {
    var result : [FTypes.FamilyTask] = [];
    for ((_, t) in tasks.entries()) {
      if (t.principalId == caller) result := result.concat([t]);
    };
    result;
  };

  // ── Grocery ────────────────────────────────────────────────────────────
  public func addGroceryItem(
    items     : Map.Map<Nat, FTypes.GroceryItem>,
    idCounter : { var next : Nat },
    caller    : Principal,
    name      : Text,
    quantity  : Text,
    unit      : Text,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    items.add(id, { id; principalId = caller; name; quantity; unit; isPurchased = false; addedAt = Time.now() });
    #ok("Grocery item added");
  };

  public func updateGroceryItem(
    items       : Map.Map<Nat, FTypes.GroceryItem>,
    caller      : Principal,
    id          : Nat,
    name        : Text,
    quantity    : Text,
    unit        : Text,
    isPurchased : Bool,
  ) : { #ok : Text; #err : Text } {
    switch (items.get(id)) {
      case null #err("Not found");
      case (?item) {
        if (item.principalId != caller) return #err("Access denied");
        items.add(id, { item with name; quantity; unit; isPurchased });
        #ok("Updated");
      };
    };
  };

  public func deleteGroceryItem(
    items  : Map.Map<Nat, FTypes.GroceryItem>,
    caller : Principal,
    id     : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (items.get(id)) {
      case null #err("Not found");
      case (?item) {
        if (item.principalId != caller) return #err("Access denied");
        items.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listGroceryItems(
    items  : Map.Map<Nat, FTypes.GroceryItem>,
    caller : Principal,
  ) : [FTypes.GroceryItem] {
    var result : [FTypes.GroceryItem] = [];
    for ((_, item) in items.entries()) {
      if (item.principalId == caller) result := result.concat([item]);
    };
    result;
  };

  // ── Calendar Events ────────────────────────────────────────────────────
  public func addCalendarEvent(
    events      : Map.Map<Nat, FTypes.FamilyCalendarEvent>,
    idCounter   : { var next : Nat },
    caller      : Principal,
    title       : Text,
    description : Text,
    date        : FTypes.Timestamp,
    time        : Text,
    reminder    : ?FTypes.Timestamp,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    events.add(id, { id; principalId = caller; title; description; date; time; reminder });
    #ok("Event added");
  };

  public func deleteCalendarEvent(
    events : Map.Map<Nat, FTypes.FamilyCalendarEvent>,
    caller : Principal,
    id     : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (events.get(id)) {
      case null #err("Not found");
      case (?e) {
        if (e.principalId != caller) return #err("Access denied");
        events.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listCalendarEvents(
    events : Map.Map<Nat, FTypes.FamilyCalendarEvent>,
    caller : Principal,
  ) : [FTypes.FamilyCalendarEvent] {
    var result : [FTypes.FamilyCalendarEvent] = [];
    for ((_, e) in events.entries()) {
      if (e.principalId == caller) result := result.concat([e]);
    };
    result;
  };

  // ── Bill Subscriptions ─────────────────────────────────────────────────
  public func addBillSubscription(
    bills     : Map.Map<Nat, FTypes.BillSubscription>,
    idCounter : { var next : Nat },
    caller    : Principal,
    name      : Text,
    amount    : Nat,
    dueDay    : Nat,
    category  : FTypes.BillCategory,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    bills.add(id, { id; principalId = caller; name; amount; dueDay; category; isActive = true });
    #ok("Bill subscription added");
  };

  public func updateBillSubscription(
    bills    : Map.Map<Nat, FTypes.BillSubscription>,
    caller   : Principal,
    id       : Nat,
    name     : Text,
    amount   : Nat,
    dueDay   : Nat,
    category : FTypes.BillCategory,
    isActive : Bool,
  ) : { #ok : Text; #err : Text } {
    switch (bills.get(id)) {
      case null #err("Not found");
      case (?b) {
        if (b.principalId != caller) return #err("Access denied");
        bills.add(id, { b with name; amount; dueDay; category; isActive });
        #ok("Updated");
      };
    };
  };

  public func deleteBillSubscription(
    bills  : Map.Map<Nat, FTypes.BillSubscription>,
    caller : Principal,
    id     : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (bills.get(id)) {
      case null #err("Not found");
      case (?b) {
        if (b.principalId != caller) return #err("Access denied");
        bills.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listBillSubscriptions(
    bills  : Map.Map<Nat, FTypes.BillSubscription>,
    caller : Principal,
  ) : [FTypes.BillSubscription] {
    var result : [FTypes.BillSubscription] = [];
    for ((_, b) in bills.entries()) {
      if (b.principalId == caller) result := result.concat([b]);
    };
    result;
  };

  // ── Health Records ─────────────────────────────────────────────────────
  public func addHealthRecord(
    records    : Map.Map<Nat, FTypes.HealthRecord>,
    idCounter  : { var next : Nat },
    caller     : Principal,
    memberName : Text,
    recordType : FTypes.HealthRecordType,
    title      : Text,
    note       : Text,
    date       : FTypes.Timestamp,
    fileUrl    : Text,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    records.add(id, { id; principalId = caller; memberName; recordType; title; note; date; fileUrl });
    #ok("Health record added");
  };

  public func deleteHealthRecord(
    records : Map.Map<Nat, FTypes.HealthRecord>,
    caller  : Principal,
    id      : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (records.get(id)) {
      case null #err("Not found");
      case (?r) {
        if (r.principalId != caller) return #err("Access denied");
        records.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listHealthRecords(
    records : Map.Map<Nat, FTypes.HealthRecord>,
    caller  : Principal,
  ) : [FTypes.HealthRecord] {
    var result : [FTypes.HealthRecord] = [];
    for ((_, r) in records.entries()) {
      if (r.principalId == caller) result := result.concat([r]);
    };
    result;
  };

  // ── Document Vault ─────────────────────────────────────────────────────
  public func addDocument(
    docs      : Map.Map<Nat, FTypes.DocumentVaultEntry>,
    idCounter : { var next : Nat },
    caller    : Principal,
    title     : Text,
    docType   : FTypes.DocumentType,
    note      : Text,
    fileUrl   : Text,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    docs.add(id, { id; principalId = caller; title; docType; note; fileUrl; uploadedAt = Time.now() });
    #ok("Document added");
  };

  public func deleteDocument(
    docs   : Map.Map<Nat, FTypes.DocumentVaultEntry>,
    caller : Principal,
    id     : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (docs.get(id)) {
      case null #err("Not found");
      case (?d) {
        if (d.principalId != caller) return #err("Access denied");
        docs.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listDocuments(
    docs   : Map.Map<Nat, FTypes.DocumentVaultEntry>,
    caller : Principal,
  ) : [FTypes.DocumentVaultEntry] {
    var result : [FTypes.DocumentVaultEntry] = [];
    for ((_, d) in docs.entries()) {
      if (d.principalId == caller) result := result.concat([d]);
    };
    result;
  };

  // ── Reminders ─────────────────────────────────────────────────────────
  public func addReminder(
    reminders  : Map.Map<Nat, FTypes.FamilyReminder>,
    idCounter  : { var next : Nat },
    caller     : Principal,
    title      : Text,
    date       : FTypes.Timestamp,
    time       : Text,
    repeatType : FTypes.RepeatType,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    reminders.add(id, { id; principalId = caller; title; date; time; repeatType; isActive = true });
    #ok("Reminder added");
  };

  public func deleteReminder(
    reminders : Map.Map<Nat, FTypes.FamilyReminder>,
    caller    : Principal,
    id        : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (reminders.get(id)) {
      case null #err("Not found");
      case (?r) {
        if (r.principalId != caller) return #err("Access denied");
        reminders.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listReminders(
    reminders : Map.Map<Nat, FTypes.FamilyReminder>,
    caller    : Principal,
  ) : [FTypes.FamilyReminder] {
    var result : [FTypes.FamilyReminder] = [];
    for ((_, r) in reminders.entries()) {
      if (r.principalId == caller) result := result.concat([r]);
    };
    result;
  };

  // ── Contacts ──────────────────────────────────────────────────────────
  public func addContact(
    contacts  : Map.Map<Nat, FTypes.FamilyContact>,
    idCounter : { var next : Nat },
    caller    : Principal,
    name      : Text,
    phone     : Text,
    relation  : Text,
    note      : Text,
  ) : { #ok : Text; #err : Text } {
    let id = idCounter.next;
    idCounter.next += 1;
    contacts.add(id, { id; principalId = caller; name; phone; relation; note });
    #ok("Contact added");
  };

  public func updateContact(
    contacts : Map.Map<Nat, FTypes.FamilyContact>,
    caller   : Principal,
    id       : Nat,
    name     : Text,
    phone    : Text,
    relation : Text,
    note     : Text,
  ) : { #ok : Text; #err : Text } {
    switch (contacts.get(id)) {
      case null #err("Not found");
      case (?c) {
        if (c.principalId != caller) return #err("Access denied");
        contacts.add(id, { c with name; phone; relation; note });
        #ok("Updated");
      };
    };
  };

  public func deleteContact(
    contacts : Map.Map<Nat, FTypes.FamilyContact>,
    caller   : Principal,
    id       : Nat,
  ) : { #ok : Text; #err : Text } {
    switch (contacts.get(id)) {
      case null #err("Not found");
      case (?c) {
        if (c.principalId != caller) return #err("Access denied");
        contacts.remove(id);
        #ok("Deleted");
      };
    };
  };

  public func listContacts(
    contacts : Map.Map<Nat, FTypes.FamilyContact>,
    caller   : Principal,
  ) : [FTypes.FamilyContact] {
    var result : [FTypes.FamilyContact] = [];
    for ((_, c) in contacts.entries()) {
      if (c.principalId == caller) result := result.concat([c]);
    };
    result;
  };
}
