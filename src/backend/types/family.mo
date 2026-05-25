import Common "common";
module {
  public type Timestamp = Common.Timestamp;

  public type FamilyExpenseCategory = {
    #Grocery;
    #Food;
    #Medical;
    #Transport;
    #Bills;
    #Entertainment;
    #Other;
  };

  public type FamilyExpense = {
    id          : Nat;
    principalId : Principal;
    amount      : Nat;
    category    : FamilyExpenseCategory;
    description : Text;
    date        : Timestamp;
    createdAt   : Timestamp;
  };

  public type TaskStatus   = { #Pending; #Done };
  public type TaskPriority = { #Low; #Medium; #High };

  public type FamilyTask = {
    id          : Nat;
    principalId : Principal;
    title       : Text;
    description : Text;
    assignedTo  : Text;
    dueDate     : ?Timestamp;
    status      : TaskStatus;
    priority    : TaskPriority;
    createdAt   : Timestamp;
  };

  public type GroceryItem = {
    id          : Nat;
    principalId : Principal;
    name        : Text;
    quantity    : Text;
    unit        : Text;
    isPurchased : Bool;
    addedAt     : Timestamp;
  };

  public type FamilyCalendarEvent = {
    id          : Nat;
    principalId : Principal;
    title       : Text;
    description : Text;
    date        : Timestamp;
    time        : Text;
    reminder    : ?Timestamp;
  };

  public type BillCategory = { #Electricity; #Gas; #Water; #DTH; #Internet; #Other };

  public type BillSubscription = {
    id          : Nat;
    principalId : Principal;
    name        : Text;
    amount      : Nat;
    dueDay      : Nat; // 1–31
    category    : BillCategory;
    isActive    : Bool;
  };

  public type HealthRecordType = { #Vaccination; #Prescription; #Report; #Other };

  public type HealthRecord = {
    id          : Nat;
    principalId : Principal;
    memberName  : Text;
    recordType  : HealthRecordType;
    title       : Text;
    note        : Text;
    date        : Timestamp;
    fileUrl     : Text;
  };

  public type DocumentType = { #Aadhaar; #PAN; #Property; #Vehicle; #Insurance; #Other };

  public type DocumentVaultEntry = {
    id          : Nat;
    principalId : Principal;
    title       : Text;
    docType     : DocumentType;
    note        : Text;
    fileUrl     : Text;
    uploadedAt  : Timestamp;
  };

  public type RepeatType = { #None; #Daily; #Weekly; #Monthly };

  public type FamilyReminder = {
    id          : Nat;
    principalId : Principal;
    title       : Text;
    date        : Timestamp;
    time        : Text;
    repeatType  : RepeatType;
    isActive    : Bool;
  };

  public type FamilyContact = {
    id          : Nat;
    principalId : Principal;
    name        : Text;
    phone       : Text;
    relation    : Text;
    note        : Text;
  };
}
