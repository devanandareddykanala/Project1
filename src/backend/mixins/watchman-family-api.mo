import Map       "mo:core/Map";
import Time      "mo:core/Time";
import Nat       "mo:core/Nat";
import Nat32     "mo:core/Nat32";
import Char      "mo:core/Char";
import WatchFamT "../types/watchman_family";
import AuthT     "../types/auth";
import Common    "../types/common";

mixin (
  users          : Map.Map<Principal, AuthT.User>,
  watchmanFamily : Map.Map<Text, WatchFamT.WatchmanFamilyMember>,
  inviteCodes    : Map.Map<Text, Common.InviteRecord>,
  ids            : { var next : Nat },
) {
  /// Add a family member for a watchman. Returns inviteCode.
  public shared ({ caller }) func addWatchmanFamilyMember(
    watchmanId : Text,
    name       : Text,
    phone      : Text,
  ) : async { #ok : Text; #err : Text } {
    ignore caller;
    let raw  = phone # Time.now().toText() # ids.next.toText();
    let seed = raw.foldLeft<Nat32>(0, func(acc, c) = acc *% 31 +% c.toNat32());
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let charsArr = Text.toArray(chars);
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
    let memberId = "WF" # ids.next.toText();
    ids.next += 1;
    let member : WatchFamT.WatchmanFamilyMember = {
      id         = memberId;
      watchmanId;
      name;
      phone;
      isActive   = true;
    };
    watchmanFamily.add(memberId, member);
    let nowNs2 = Time.now();
    let expiry7d : Int = nowNs2 + 7 * 24 * 60 * 60 * 1_000_000_000;
    let linkToken2 = code;
    inviteCodes.add(code, {
      role        = #WatchmanFamily;
      apartmentId = null;
      flatId      = null;
      createdAt   = nowNs2;
      expiresAt   = expiry7d;
      var used    = false;
      inviteLink  = "develvyn.app/join/" # linkToken2;
    });
    #ok(code);
  };

  /// List all active family members for a watchman.
  public query ({ caller }) func getWatchmanFamily(
    watchmanId : Text,
  ) : async [WatchFamT.WatchmanFamilyMember] {
    ignore caller;
    watchmanFamily.values().toArray().filter(func(m : WatchFamT.WatchmanFamilyMember) : Bool {
      m.watchmanId == watchmanId and m.isActive
    });
  };
}
