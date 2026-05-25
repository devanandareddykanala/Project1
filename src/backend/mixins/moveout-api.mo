import Map      "mo:core/Map";
import Time     "mo:core/Time";
import Nat      "mo:core/Nat";
import Text     "mo:core/Text";
import Char     "mo:core/Char";
import MoveOutT "../types/moveout";
import AuthT    "../types/auth";
import Common   "../types/common";

mixin (
  users      : Map.Map<Principal, AuthT.User>,
  checklists : Map.Map<Text, MoveOutT.MoveOutChecklist>,
  inviteCodes: Map.Map<Text, Common.InviteRecord>,
  ids        : { var next : Nat },
) {
  /// Initiate a move-out flow for a flat. Returns checklistId.
  public shared ({ caller }) func initiateMovOut(
    flatId : Text,
  ) : async { #ok : Text; #err : Text } {
    ignore caller;
    let checklistId = "CL" # ids.next.toText();
    ids.next += 1;
    let defaultItems : [MoveOutT.ChecklistEntry] = [
      { item = "Dues cleared";            completed = false },
      { item = "Deposit settled";         completed = false },
      { item = "Keys returned";           completed = false },
      { item = "Flat inspected";          completed = false },
      { item = "Utilities disconnected";  completed = false },
    ];
    let checklist : MoveOutT.MoveOutChecklist = {
      flatId;
      items       = defaultItems;
      initiatedAt = Time.now();
      completedAt = null;
    };
    checklists.add(checklistId, checklist);
    #ok(checklistId);
  };

  /// Mark a checklist item as complete.
  public shared ({ caller }) func completeChecklistItem(
    checklistId : Text,
    item        : Text,
  ) : async { #ok : (); #err : Text } {
    ignore caller;
    let checklist = switch (checklists.get(checklistId)) {
      case null return #err("Checklist not found: " # checklistId);
      case (?c) c;
    };
    let updatedItems = checklist.items.map(
      func(e) { if (e.item == item) { { e with completed = true } } else { e } }
    );
    checklists.add(checklistId, { checklist with items = updatedItems });
    #ok(());
  };

  /// Finalise move-out: revokes all access for the flat.
  public shared ({ caller }) func completeMovOut(
    flatId : Text,
  ) : async { #ok : (); #err : Text } {
    ignore caller;
    var checklistOpt : ?MoveOutT.MoveOutChecklist = null;
    var checklistKey : Text = "";
    for ((k, c) in checklists.entries()) {
      if (c.flatId == flatId and c.completedAt == null) {
        checklistOpt := ?c;
        checklistKey := k;
      };
    };
    let checklist = switch (checklistOpt) {
      case null return #err("No active move-out checklist for flat: " # flatId);
      case (?c) c;
    };
    let incomplete = checklist.items.filter(func(e : MoveOutT.ChecklistEntry) : Bool {
      not e.completed
    });
    if (incomplete.size() > 0) {
      let names = incomplete.foldLeft("", func(acc : Text, e : MoveOutT.ChecklistEntry) : Text {
        if (acc == "") e.item else acc # ", " # e.item
      });
      return #err("Incomplete checklist items: " # names);
    };
    checklists.add(checklistKey, { checklist with completedAt = ?Time.now() });
    // Revoke invite codes for this flat
    for ((code, inv) in inviteCodes.entries()) {
      switch (inv.flatId) {
        case (?invFlat) {
          if (invFlat.toText() == flatId) {
            inv.used := true;
          };
        };
        case null {};
      };
    };
    #ok(());
  };

  /// Initiate a move-in for a flat by generating an invite for the new tenant.
  /// Returns inviteCode.
  public shared ({ caller }) func initiateMovIn(
    flatId         : Text,
    newTenantPhone : Text,
    newTenantName  : Text,
  ) : async { #ok : Text; #err : Text } {
    ignore (caller, newTenantName);
    let raw  = newTenantPhone # Time.now().toText() # ids.next.toText();
    let seed = raw.foldLeft<Nat32>(0, func(acc, c) = acc *% 31 +% c.toNat32());
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let charsArr = chars.toArray();
    var code = "";
    var s = seed;
    var i = 0;
    while (i < 6) {
      let idx = (s % 36).toNat();
      let ch = if (idx < charsArr.size()) charsArr[idx] else 'A';
      code := code # ch.toText();
      s := s / 36;
      i += 1;
    };
    ids.next += 1;
    let flatNat : ?Common.FlatId = switch (Nat.fromText(flatId)) {
      case (?n) ?n;
      case null null;
    };
    inviteCodes.add(code, {
      role        = #FlatAdmin;
      apartmentId = null;
      flatId      = flatNat;
      createdAt   = Time.now();
      expiresAt   = Time.now() + (48 * 3_600_000_000_000);
      var used    = false;
      inviteLink  = "develvyn.app/join/" # code;
    });
    #ok(code);
  };

  /// Query the current move-out checklist for a flat.
  public query ({ caller }) func getMoveOutChecklist(
    flatId : Text,
  ) : async ?MoveOutT.MoveOutChecklist {
    ignore caller;
    var result : ?MoveOutT.MoveOutChecklist = null;
    for ((_, c) in checklists.entries()) {
      if (c.flatId == flatId and c.completedAt == null) {
        result := ?c;
      };
    };
    result;
  };
}
