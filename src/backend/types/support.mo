import Common "common";
module {
  public type ApartmentId = Common.ApartmentId;
  public type UserId      = Common.UserId;
  public type Timestamp   = Common.Timestamp;

  public type TicketCategory = { #Bug; #Feature; #Payment; #Account; #Billing; #Technical; #Dispute; #Other };
  public type TicketStatus   = { #Open; #InProgress; #WaitingForUser; #Resolved };
  public type TicketPriority = { #Normal; #Urgent };
  public type TicketType     = { #Support; #DisputeEscalation };

  public type TicketMessage = {
    id           : Nat;
    ticketId     : Nat;
    authorId     : UserId;
    message      : Text;
    isInternal   : Bool;   // true = Founder Portal only, never shown to user
    attachmentUrl: ?Text;
    createdAt    : Timestamp;
  };

  public type SlaMetadata = {
    firstResponseSla  : Timestamp;  // expected first response deadline (ns)
    resolutionSla     : Timestamp;  // expected resolution deadline (ns)
    firstResponseAt   : ?Timestamp; // actual first response time
    resolvedAt        : ?Timestamp;
    breached          : Bool;
  };

  public type SupportTicket = {
    id            : Nat;
    apartmentId   : ?ApartmentId;
    userId        : UserId;
    subject       : Text;        // max 80 chars
    description   : Text;
    category      : TicketCategory;
    priority      : TicketPriority;
    ticketType    : TicketType;
    status        : TicketStatus;
    assignedTo    : ?UserId;
    sla           : SlaMetadata;
    createdAt     : Timestamp;
    updatedAt     : Timestamp;
  };

  public type AppFeedback = {
    id         : Nat;
    userId     : UserId;
    rating     : Nat; // 1–5
    comment    : Text;
    moduleName : Text;
    createdAt  : Timestamp;
  };

  // Founder Portal — subscription row per apartment
  public type SubscriptionRow = {
    apartmentId   : ApartmentId;
    apartmentName : Text;
    city          : Text;
    flatsCount    : Nat;
    dueDate       : Timestamp;
    status        : Common.SubscriptionStatus;
    utrSubmitted  : Bool;
    adminUserId   : UserId;
  };

  public type PlatformHealth = {
    uptimePercent  : Nat;   // 0–100
    activeUsers    : Nat;
    failedLogins   : Nat;
    sosCount       : Nat;
    cycleBalance   : Nat;   // placeholder — frontend can display
  };
}
