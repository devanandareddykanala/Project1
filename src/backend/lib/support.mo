import Time "mo:core/Time";
import Common "../types/common";
import STypes "../types/support";
import Map "mo:core/Map";

module {
  // Create a support ticket
  public func createTicket(
    tickets     : Map.Map<Nat, STypes.SupportTicket>,
    idCounter   : { var next : Nat },
    userId      : Common.UserId,
    apartmentId : ?Common.ApartmentId,
    subject     : Text,
    description : Text,
    category    : STypes.TicketCategory,
    priority    : STypes.TicketPriority,
    ticketType  : STypes.TicketType,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let now = Time.now();
    let sla = computeSla(priority, ticketType);
    let ticket : STypes.SupportTicket = {
      id;
      apartmentId;
      userId;
      subject;
      description;
      category;
      priority;
      ticketType;
      status = #Open;
      assignedTo = null;
      sla;
      createdAt = now;
      updatedAt = now;
    };
    tickets.add(id, ticket);
    #ok("Ticket created with id " # debug_show(id));
  };

  // Update ticket status
  public func updateTicketStatus(
    tickets   : Map.Map<Nat, STypes.SupportTicket>,
    ticketId  : Nat,
    status    : STypes.TicketStatus,
    _updatedBy : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (tickets.get(ticketId)) {
      case null #err("Ticket not found");
      case (?t) {
        tickets.add(ticketId, { t with status; updatedAt = Time.now() });
        #ok("Status updated");
      };
    };
  };

  // Get tickets
  public func getTickets(
    tickets   : Map.Map<Nat, STypes.SupportTicket>,
    userId    : Common.UserId,
    isFounder : Bool,
  ) : [STypes.SupportTicket] {
    var result : [STypes.SupportTicket] = [];
    for ((_, t) in tickets.entries()) {
      if (isFounder or t.userId == userId) {
        result := result.concat([t]);
      };
    };
    result;
  };

  // Submit app feedback
  public func submitFeedback(
    feedbacks  : Map.Map<Nat, STypes.AppFeedback>,
    idCounter  : { var next : Nat },
    userId     : Common.UserId,
    rating     : Nat,
    comment    : Text,
    moduleName : Text,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let fb : STypes.AppFeedback = {
      id;
      userId;
      rating;
      comment;
      moduleName;
      createdAt = Time.now();
    };
    feedbacks.add(id, fb);
    #ok("Feedback submitted");
  };

  // Get all feedback (Founder only)
  public func getFeedback(
    feedbacks : Map.Map<Nat, STypes.AppFeedback>,
  ) : [STypes.AppFeedback] {
    var result : [STypes.AppFeedback] = [];
    for ((_, fb) in feedbacks.entries()) {
      result := result.concat([fb]);
    };
    result;
  };

  // Add a message (or internal note) to a ticket thread
  public func addMessage(
    messages  : Map.Map<Nat, STypes.TicketMessage>,
    idCounter : { var next : Nat },
    ticketId  : Nat,
    authorId  : Common.UserId,
    message   : Text,
    isInternal : Bool,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let msg : STypes.TicketMessage = {
      id;
      ticketId;
      authorId;
      message;
      isInternal;
      attachmentUrl = null;
      createdAt = Time.now();
    };
    messages.add(id, msg);
    #ok("Message added with id " # debug_show(id));
  };

  // Compute SLA deadlines based on priority and ticket type
  public func computeSla(
    priority   : STypes.TicketPriority,
    ticketType : STypes.TicketType,
  ) : STypes.SlaMetadata {
    let now = Time.now();
    let hour : Int = 3_600_000_000_000;   // nanoseconds
    let day  : Int = 24 * hour;
    let (firstResponseNs, resolutionNs) : (Int, Int) = switch (ticketType) {
      case (#DisputeEscalation) (24 * hour, 7 * day);
      case (#Support) {
        switch (priority) {
          case (#Urgent) (4 * hour, 48 * hour);
          case (#Normal) (48 * hour, 7 * day);
        };
      };
    };
    {
      firstResponseSla = now + firstResponseNs;
      resolutionSla    = now + resolutionNs;
      firstResponseAt  = null;
      resolvedAt       = null;
      breached         = false;
    };
  };

  // Get messages for a ticket (filter internal if caller is not Founder-level)
  public func getTicketThread(
    messages  : Map.Map<Nat, STypes.TicketMessage>,
    ticketId  : Nat,
    showInternal : Bool,
  ) : [STypes.TicketMessage] {
    var result : [STypes.TicketMessage] = [];
    for ((_, m) in messages.entries()) {
      if (m.ticketId == ticketId and (showInternal or not m.isInternal)) {
        result := result.concat([m]);
      };
    };
    result;
  };

  // Get only dispute-escalation tickets
  public func getDisputeEscalations(
    tickets : Map.Map<Nat, STypes.SupportTicket>,
  ) : [STypes.SupportTicket] {
    var result : [STypes.SupportTicket] = [];
    for ((_, t) in tickets.entries()) {
      switch (t.ticketType) {
        case (#DisputeEscalation) { result := result.concat([t]) };
        case _ {};
      };
    };
    result;
  };
}
