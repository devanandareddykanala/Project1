import Common "../types/common";
import STypes "../types/support";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import SupportLib "../lib/support";

mixin (
  users              : Map.Map<Principal, AuthTypes.User>,
  tickets            : Map.Map<Nat, STypes.SupportTicket>,
  ticketMessages     : Map.Map<Nat, STypes.TicketMessage>,
  feedbacks          : Map.Map<Nat, STypes.AppFeedback>,
  ticketIdCounter    : { var next : Nat },
  msgIdCounter       : { var next : Nat },
  feedbackIdCounter  : { var next : Nat },
) {
  // Create a support ticket (subject + priority + ticketType)
  public shared ({ caller }) func createTicket(
    subject     : Text,
    description : Text,
    category    : STypes.TicketCategory,
    priority    : STypes.TicketPriority,
    ticketType  : STypes.TicketType,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest, #Founder, #CoFounder, #Employee]);
    SupportLib.createTicket(tickets, ticketIdCounter, user.id, user.apartmentId, subject, description, category, priority, ticketType);
  };

  // Update ticket status (Founder / CoFounder / Employee)
  public shared ({ caller }) func updateTicketStatus(
    ticketId : Nat,
    status   : STypes.TicketStatus,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    SupportLib.updateTicketStatus(tickets, ticketId, status, user.id);
  };

  // Get tickets — Founder/CoFounder: all; others: own only
  public shared query ({ caller }) func getTickets() : async [STypes.SupportTicket] {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest, #Founder, #CoFounder, #Employee]);
    let isFounder = switch (user.role) {
      case (#Founder or #CoFounder) true;
      case _ false;
    };
    SupportLib.getTickets(tickets, user.id, isFounder);
  };

  // Add a reply message to a ticket thread (any authenticated user)
  public shared ({ caller }) func addMessage(
    ticketId : Nat,
    message  : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest, #Founder, #CoFounder, #Employee]);
    SupportLib.addMessage(ticketMessages, msgIdCounter, ticketId, user.id, message, false);
  };

  // Add an internal note (Founder Portal only — invisible to ticket raiser)
  public shared ({ caller }) func addInternalNote(
    ticketId : Nat,
    note     : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    SupportLib.addMessage(ticketMessages, msgIdCounter, ticketId, user.id, note, true);
  };

  // Get full thread for a ticket
  public shared query ({ caller }) func getTicketThread(
    ticketId : Nat,
  ) : async Common.Result<[STypes.TicketMessage], Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest, #Founder, #CoFounder, #Employee]);
    let showInternal = switch (user.role) {
      case (#Founder or #CoFounder or #Employee) true;
      case _ false;
    };
    #ok(SupportLib.getTicketThread(ticketMessages, ticketId, showInternal));
  };

  // Mark a ticket as resolved with a resolution note
  public shared ({ caller }) func markResolved(
    ticketId       : Nat,
    resolutionNote : Text,
  ) : async Common.Result<(), Text> {
    let user = AuthLib.assertRole(users, caller, [#Founder, #CoFounder, #Employee]);
    switch (SupportLib.updateTicketStatus(tickets, ticketId, #Resolved, user.id)) {
      case (#err e) #err(e);
      case (#ok _) {
        // Add resolution note as internal message
        ignore SupportLib.addMessage(ticketMessages, msgIdCounter, ticketId, user.id, resolutionNote, true);
        #ok(());
      };
    };
  };

  // Reopen a resolved ticket
  public shared ({ caller }) func reopenTicket(
    ticketId : Nat,
    reason   : Text,
  ) : async Common.Result<(), Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest, #Founder, #CoFounder, #Employee]);
    switch (SupportLib.updateTicketStatus(tickets, ticketId, #Open, user.id)) {
      case (#err e) #err(e);
      case (#ok _) {
        ignore SupportLib.addMessage(ticketMessages, msgIdCounter, ticketId, user.id, "Reopened: " # reason, false);
        #ok(());
      };
    };
  };

  // Get dispute escalations (Founder / CoFounder only)
  public shared query ({ caller }) func getDisputeEscalations() : async Common.Result<[STypes.SupportTicket], Text> {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder]);
    #ok(SupportLib.getDisputeEscalations(tickets));
  };

  // Submit app feedback
  public shared ({ caller }) func submitFeedback(
    rating     : Nat,
    comment    : Text,
    moduleName : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest, #Founder, #CoFounder, #Employee]);
    SupportLib.submitFeedback(feedbacks, feedbackIdCounter, user.id, rating, comment, moduleName);
  };

  // Get all feedback (Founder only)
  public shared query ({ caller }) func getFeedback() : async [STypes.AppFeedback] {
    ignore AuthLib.assertRole(users, caller, [#Founder, #CoFounder]);
    SupportLib.getFeedback(feedbacks);
  };
}
