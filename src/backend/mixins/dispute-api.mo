import Map      "mo:core/Map";
import Time     "mo:core/Time";
import Nat      "mo:core/Nat";
import DisputeT "../types/dispute";
import AuthT    "../types/auth";
import Iter "mo:core/Iter";

mixin (
  users    : Map.Map<Principal, AuthT.User>,
  disputes : Map.Map<Text, DisputeT.DisputeRecord>,
  ids      : { var next : Nat },
) {
  /// Create a new dispute. Returns disputeId.
  public shared ({ caller }) func createDispute(
    flatId      : Text,
    category    : Text,
    description : Text,
    photo       : ?Blob,
  ) : async { #ok : Text; #err : Text } {
    ignore photo;
    let disputeId = "D" # ids.next.toText();
    ids.next += 1;
    let record : DisputeT.DisputeRecord = {
      id          = disputeId;
      flatId;
      category;
      description;
      status      = "open";
      tier        = 1;
      createdAt   = Time.now();
      notes       = [];
      resolvedAt  = null;
      resolution  = null;
    };
    disputes.add(disputeId, record);
    #ok(disputeId);
  };

  /// Add a note (and optional evidence) to an existing dispute.
  public shared ({ caller }) func addDisputeNote(
    disputeId : Text,
    note      : Text,
    evidence  : ?Blob,
  ) : async { #ok : (); #err : Text } {
    ignore evidence;
    let record = switch (disputes.get(disputeId)) {
      case null return #err("Dispute not found: " # disputeId);
      case (?r) r;
    };
    let authorUser = switch (users.get(caller)) {
      case null return #err("Caller not registered");
      case (?u) u;
    };
    let newNote : DisputeT.DisputeNote = {
      author  = authorUser.name;
      note;
      addedAt = Time.now();
    };
    let updated = { record with notes = record.notes.concat([newNote]) };
    disputes.add(disputeId, updated);
    #ok(());
  };

  /// Escalate a dispute one tier: Flat Admin -> Super Admin -> Founder.
  public shared ({ caller }) func escalateDispute(
    disputeId : Text,
  ) : async { #ok : (); #err : Text } {
    ignore caller;
    let record = switch (disputes.get(disputeId)) {
      case null return #err("Dispute not found: " # disputeId);
      case (?r) r;
    };
    let updated = switch (record.tier) {
      case 1 { { record with tier = 2; status = "escalated_admin" } };
      case 2 { { record with tier = 3; status = "escalated_founder" } };
      case _ return #err("Already at maximum escalation level");
    };
    disputes.add(disputeId, updated);
    #ok(());
  };

  /// Resolve a dispute with a resolution note.
  public shared ({ caller }) func resolveDispute(
    disputeId  : Text,
    resolution : Text,
  ) : async { #ok : (); #err : Text } {
    ignore caller;
    let record = switch (disputes.get(disputeId)) {
      case null return #err("Dispute not found: " # disputeId);
      case (?r) r;
    };
    let updated = { record with
      status     = "resolved";
      resolvedAt = ?Time.now();
      resolution = ?resolution;
    };
    disputes.add(disputeId, updated);
    #ok(());
  };

  /// List disputes. Optional filter: "open" | "resolved" | "all" | flatId.
  public query ({ caller }) func getDisputes(
    filter : ?Text,
  ) : async [DisputeT.DisputeRecord] {
    ignore caller;
    let all = disputes.entries().map(func((_, v) : (Text, DisputeT.DisputeRecord)) : DisputeT.DisputeRecord { v }).toArray();
    switch (filter) {
      case null     all;
      case (?"all") all;
      case (?f) {
        all.filter(func(d : DisputeT.DisputeRecord) : Bool {
          d.status == f or d.flatId == f
        })
      };
    };
  };
}
