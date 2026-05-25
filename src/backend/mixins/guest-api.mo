import Map    "mo:core/Map";
import Time   "mo:core/Time";
import Nat    "mo:core/Nat";
import Char   "mo:core/Char";
import GuestT "../types/guest";
import AuthT  "../types/auth";
import Common "../types/common";

mixin (
  users       : Map.Map<Principal, AuthT.User>,
  guests      : Map.Map<Text, GuestT.GuestRecord>,
  inviteCodes : Map.Map<Text, Common.InviteRecord>,
  ids         : { var next : Nat },
) {
  /// Create a time-bound guest account. Returns inviteCode.
  public shared ({ caller }) func createGuest(
    flatId       : Text,
    guestName    : Text,
    guestPhone   : Text,
    durationDays : Nat,
  ) : async { #ok : Text; #err : Text } {
    ignore caller;
    let raw  = guestPhone # Time.now().toText() # ids.next.toText();
    let seed = raw.foldLeft<Nat32>(0, func(acc, c) = acc *% 31 +% c.toNat32());
    let charList = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9'];
    var code = "";
    var s = seed;
    var i = 0;
    while (i < 6) {
      let idx = (s % 36).toNat();
      let ch = if (idx < charList.size()) charList[idx] else 'A';
      code := code # ch.toText();
      s := s / 36;
      i += 1;
    };
    let guestId = "G" # ids.next.toText();
    ids.next += 1;
    let nowNs  = Time.now();
    let dayNs  : Int = 86_400_000_000_000;
    let expiry : Int = nowNs + durationDays.toInt() * dayNs;
    let flatNat : ?Common.FlatId = switch (Nat.fromText(flatId)) {
      case (?n) ?n;
      case null null;
    };
    let record : GuestT.GuestRecord = {
      id        = guestId;
      flatId;
      name      = guestName;
      phone     = guestPhone;
      createdAt = nowNs;
      expiresAt = expiry;
      isActive  = true;
    };
    guests.add(guestId, record);
    let linkToken = code;
    inviteCodes.add(code, {
      role        = #Guest;
      apartmentId = null;
      flatId      = flatNat;
      createdAt   = nowNs;
      expiresAt   = expiry;
      var used    = false;
      inviteLink  = "develvyn.app/join/" # linkToken;
    });
    #ok(code);
  };

  /// List all active, non-expired guests for an apartment.
  public query ({ caller }) func getGuests(
    apartmentId : Text,
  ) : async [GuestT.GuestRecord] {
    ignore (caller, apartmentId);
    let now = Time.now();
    guests.values().toArray().filter(func(g : GuestT.GuestRecord) : Bool {
      g.isActive and g.expiresAt > now
    });
  };

  /// Revoke a guest's access immediately.
  public shared ({ caller }) func revokeGuest(
    guestId : Text,
  ) : async { #ok : (); #err : Text } {
    ignore caller;
    let record = switch (guests.get(guestId)) {
      case null return #err("Guest not found: " # guestId);
      case (?g) g;
    };
    guests.add(guestId, { record with isActive = false });
    #ok(());
  };
}
