import Common "../types/common";
import MTypes "../types/maintenance";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import MaintenanceLib "../lib/maintenance";
import Time "mo:core/Time";
import Nat "mo:core/Nat";

mixin (
  users        : Map.Map<Principal, AuthTypes.User>,
  payments     : Map.Map<Nat, MTypes.MaintenancePayment>,
  wallet       : Map.Map<Nat, MTypes.WalletEntry>,
  payIdCounter : { var next : Nat },
  walIdCounter : { var next : Nat },
  upiHistory   : Map.Map<Common.ApartmentId, [{ upiId : Text; qrImageUrl : ?Text; effectiveFrom : Int; archivedAt : ?Int }]>,
) {
  // Set active UPI ID / QR for the apartment (SuperAdmin only)
  public shared ({ caller }) func setUpiId(
    upiId      : Text,
    qrImageUrl : ?Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    let aptId = switch (user.apartmentId) {
      case null return #err("Caller has no apartment");
      case (?a) a;
    };
    let now = Time.now();
    // Archive previous active entry
    let existing = switch (upiHistory.get(aptId)) {
      case null [];
      case (?arr) arr;
    };
    // Mark last entry as archived if present
    let archived : [{ upiId : Text; qrImageUrl : ?Text; effectiveFrom : Int; archivedAt : ?Int }] = if (existing.size() > 0) {
      let last = existing[existing.size() - 1];
      let prev : [{ upiId : Text; qrImageUrl : ?Text; effectiveFrom : Int; archivedAt : ?Int }] = existing;
      prev.concat([{ last with archivedAt = ?now }]);
    } else {
      [];
    };
    let newEntry = { upiId; qrImageUrl; effectiveFrom = now; archivedAt = null };
    upiHistory.add(aptId, archived.concat([newEntry]));
    #ok("UPI ID updated");
  };

  // Get current active UPI ID / QR for an apartment
  public shared query ({ caller }) func getActiveUpiId(
    apartmentId : Common.ApartmentId,
  ) : async ?{ upiId : Text; qrImageUrl : ?Text; effectiveFrom : Int } {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Guest]);
    switch (upiHistory.get(apartmentId)) {
      case null null;
      case (?arr) {
        if (arr.size() == 0) return null;
        let last = arr[arr.size() - 1];
        if (last.archivedAt != null) return null;
        ?{ upiId = last.upiId; qrImageUrl = last.qrImageUrl; effectiveFrom = last.effectiveFrom };
      };
    };
  };

  // Role-scoped wallet summary
  public shared query ({ caller }) func getWalletSummaryForRole(
    apartmentId : Common.ApartmentId,
  ) : async { balance : Int; totalCollected : Int; totalSpent : Int; entries : ?[MTypes.WalletEntry] } {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge]);
    var totalCollected : Int = 0;
    var totalSpent     : Int = 0;
    var flatCredits    : [MTypes.WalletEntry] = [];
    var allEntries     : [MTypes.WalletEntry] = [];
    wallet.forEach(func(_, e) {
      if (e.apartmentId == apartmentId) {
        switch (e.entryType) {
          case (#Credit) {
            totalCollected += e.amount.toInt();
            switch (user.flatId) {
              case (?fid) {
                if (e.flatId == ?fid) { flatCredits := flatCredits.concat([e]) };
              };
              case null {};
            };
          };
          case (#Debit) { totalSpent += e.amount.toInt() };
          case (#Correction) {};
        };
        allEntries := allEntries.concat([e]);
      };
    });
    let balance = totalCollected - totalSpent;
    switch (user.role) {
      case (#SuperAdmin or #RotatingIncharge) {
        { balance; totalCollected; totalSpent; entries = ?allEntries };
      };
      case (#FlatAdmin) {
        { balance; totalCollected; totalSpent; entries = ?flatCredits };
      };
      case _ {
        { balance; totalCollected = 0; totalSpent = 0; entries = null };
      };
    };
  };

  // Submit a maintenance payment
  public shared ({ caller }) func submitPayment(
    flatId        : Common.FlatId,
    apartmentId   : Common.ApartmentId,
    amount        : Nat,
    month         : Nat,
    year          : Nat,
    utrNumber     : Text,
    screenshotUrl : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#FlatAdmin, #FamilyMember, #SuperAdmin, #RotatingIncharge]);
    MaintenanceLib.submitPayment(payments, payIdCounter, user.id, flatId, apartmentId, amount, month, year, utrNumber, screenshotUrl);
  };

  // Verify or reject a payment (SuperAdmin / Incharge)
  public shared ({ caller }) func verifyPayment(
    paymentId : Nat,
    approve   : Bool,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    MaintenanceLib.verifyPayment(payments, wallet, walIdCounter, paymentId, user.id, approve);
  };

  // Get payments for a specific flat
  public shared query ({ caller }) func getPaymentsByFlat(
    flatId : Common.FlatId,
  ) : async [MTypes.MaintenancePayment] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge]);
    MaintenanceLib.getPaymentsByFlat(payments, flatId);
  };

  // Get pending payments for an apartment (SuperAdmin)
  public shared query ({ caller }) func getPendingPayments(
    apartmentId : Common.ApartmentId,
  ) : async [MTypes.MaintenancePayment] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    MaintenanceLib.getPendingPayments(payments, apartmentId);
  };

  // Initiate a debit from wallet (SuperAdmin)
  public shared ({ caller }) func initiateDebit(
    apartmentId : Common.ApartmentId,
    amount      : Nat,
    purpose     : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    MaintenanceLib.initiateDebit(wallet, walIdCounter, apartmentId, amount, purpose, user.id);
  };

  // Approve a pending debit (FlatAdmin)
  public shared ({ caller }) func approveDebit(
    entryId : Nat,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#FlatAdmin, #SuperAdmin]);
    MaintenanceLib.approveDebit(wallet, entryId, user.id);
  };

  // Get wallet balance (role-scoped)
  public shared query ({ caller }) func getWalletBalance(
    apartmentId : Common.ApartmentId,
  ) : async Nat {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge, #Watchman, #WatchmanFamily, #Guest]);
    MaintenanceLib.getWalletBalance(wallet, apartmentId);
  };

  // Get full wallet ledger (SuperAdmin only)
  public shared query ({ caller }) func getWalletLedger(
    apartmentId : Common.ApartmentId,
  ) : async [MTypes.WalletEntry] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    MaintenanceLib.getWalletLedger(wallet, apartmentId);
  };

  // Cross-mode read: maintenance status for own flat (Family Mode)
  public shared query ({ caller }) func getMaintenanceForFlat(
    flatId : Common.FlatId,
  ) : async [MTypes.MaintenancePayment] {
    ignore AuthLib.assertRole(users, caller, [#FamilyMember, #FlatAdmin, #SuperAdmin, #RotatingIncharge]);
    MaintenanceLib.getPaymentsByFlat(payments, flatId);
  };

  // Add correction entry for a wallet entry (permanent audit trail, never deletes original)
  public shared ({ caller }) func addCorrectionEntry(
    originalId      : Nat,
    reason          : Text,
    correctedAmount : ?Nat,
    note            : Text,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge]);
    MaintenanceLib.addCorrection(wallet, walIdCounter, originalId, reason, correctedAmount, note, user.id);
  };

  // Reject a pending debit (SuperAdmin / FlatAdmin)
  public shared ({ caller }) func rejectDebit(
    debitId : Nat,
    reason  : Text,
  ) : async Common.Result<(), Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #RotatingIncharge]);
    MaintenanceLib.rejectDebit(wallet, debitId, reason, user.id);
  };
}
