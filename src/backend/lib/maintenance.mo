import Time "mo:core/Time";
import Common "../types/common";
import MTypes "../types/maintenance";
import Map "mo:core/Map";

module {
  // Submit a maintenance payment (with UTR)
  public func submitPayment(
    payments      : Map.Map<Nat, MTypes.MaintenancePayment>,
    idCounter     : { var next : Nat },
    _caller       : Common.UserId,
    flatId        : Common.FlatId,
    apartmentId   : Common.ApartmentId,
    amount        : Nat,
    month         : Nat,
    year          : Nat,
    utrNumber     : Text,
    screenshotUrl : Text,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let payment : MTypes.MaintenancePayment = {
      id;
      flatId;
      apartmentId;
      amount;
      month;
      year;
      utrNumber;
      screenshotUrl;
      status = #Pending;
      verifiedBy = null;
      createdAt = Time.now();
      correctionOf = null;
      correctionNote = null;
    };
    payments.add(id, payment);
    #ok("Payment submitted with id " # debug_show(id));
  };

  // Verify or reject a payment
  public func verifyPayment(
    payments   : Map.Map<Nat, MTypes.MaintenancePayment>,
    wallet     : Map.Map<Nat, MTypes.WalletEntry>,
    wIdCounter : { var next : Nat },
    paymentId  : Nat,
    verifiedBy : Common.UserId,
    approve    : Bool,
  ) : Common.Result<Text, Text> {
    switch (payments.get(paymentId)) {
      case null #err("Payment not found");
      case (?p) {
        if (approve) {
          payments.add(paymentId, { p with status = #Verified; verifiedBy = ?verifiedBy });
          // Add credit to wallet
          ignore addCredit(
            wallet, wIdCounter,
            p.apartmentId, ?p.flatId,
            p.amount,
            "Maintenance " # debug_show(p.month) # "/" # debug_show(p.year),
            ?p.utrNumber,
            verifiedBy,
          );
          #ok("Payment verified and wallet credited");
        } else {
          payments.add(paymentId, { p with status = #Rejected; verifiedBy = ?verifiedBy });
          #ok("Payment rejected");
        };
      };
    };
  };

  // Get payments for a flat
  public func getPaymentsByFlat(
    payments : Map.Map<Nat, MTypes.MaintenancePayment>,
    flatId   : Common.FlatId,
  ) : [MTypes.MaintenancePayment] {
    var result : [MTypes.MaintenancePayment] = [];
    for ((_, p) in payments.entries()) {
      if (p.flatId == flatId) {
        result := result.concat([p]);
      };
    };
    result;
  };

  // Get pending payments for an apartment
  public func getPendingPayments(
    payments    : Map.Map<Nat, MTypes.MaintenancePayment>,
    apartmentId : Common.ApartmentId,
  ) : [MTypes.MaintenancePayment] {
    var result : [MTypes.MaintenancePayment] = [];
    for ((_, p) in payments.entries()) {
      if (p.apartmentId == apartmentId) {
        switch (p.status) {
          case (#Pending) { result := result.concat([p]) };
          case _ {};
        };
      };
    };
    result;
  };

  // Add credit to wallet
  public func addCredit(
    wallet      : Map.Map<Nat, MTypes.WalletEntry>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    flatId      : ?Common.FlatId,
    amount      : Nat,
    purpose     : Text,
    utrNumber   : ?Text,
    approvedBy  : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let entry : MTypes.WalletEntry = {
      id;
      apartmentId;
      entryType = #Credit;
      amount;
      flatId;
      purpose;
      utrNumber;
      approvedBy = [approvedBy];
      status = #Executed;
      createdAt = Time.now();
      isPermanent = true;
      correctionOf = null;
      correctionNote = null;
    };
    wallet.add(id, entry);
    #ok("Credit added");
  };

  // Initiate debit (needs 2 approvals for > Rs 2000)
  public func initiateDebit(
    wallet      : Map.Map<Nat, MTypes.WalletEntry>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    amount      : Nat,
    purpose     : Text,
    _requestedBy : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    // Small amounts (≤2000) auto-approved; larger ones need 2 FlatAdmin approvals
    let initialStatus : MTypes.DebitApprovalStatus = if (amount <= 2000) #Approved else #Pending;
    let entry : MTypes.WalletEntry = {
      id;
      apartmentId;
      entryType = #Debit;
      amount;
      flatId = null;
      purpose;
      utrNumber = null;
      approvedBy = [];
      status = initialStatus;
      createdAt = Time.now();
      isPermanent = true;
      correctionOf = null;
      correctionNote = null;
    };
    wallet.add(id, entry);
    #ok("Debit initiated with id " # debug_show(id));
  };

  // Approve a pending debit (FlatAdmin)
  public func approveDebit(
    wallet     : Map.Map<Nat, MTypes.WalletEntry>,
    entryId    : Nat,
    approverId : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (wallet.get(entryId)) {
      case null #err("Wallet entry not found");
      case (?entry) {
        switch (entry.status) {
          case (#Pending) {
            // Check not already approved by this user
            let alreadyApproved = entry.approvedBy.find(func(id : Common.UserId) : Bool { id == approverId });
            switch (alreadyApproved) {
              case (?_) #err("Already approved by this user");
              case null {
                let newApprovedBy = entry.approvedBy.concat([approverId]);
                // 2 approvals execute the debit
                let newStatus : MTypes.DebitApprovalStatus = if (newApprovedBy.size() >= 2) #Approved else #Pending;
                wallet.add(entryId, { entry with approvedBy = newApprovedBy; status = newStatus });
                #ok("Approved");
              };
            };
          };
          case _ #err("Entry is not pending approval");
        };
      };
    };
  };

  // Get wallet balance
  public func getWalletBalance(
    wallet      : Map.Map<Nat, MTypes.WalletEntry>,
    apartmentId : Common.ApartmentId,
  ) : Nat {
    var credits : Nat = 0;
    var debits  : Nat = 0;
    for ((_, e) in wallet.entries()) {
      if (e.apartmentId == apartmentId) {
        switch (e.entryType, e.status) {
          case (#Credit, #Executed) { credits += e.amount };
          case (#Debit, #Approved)  { debits  += e.amount };
          case _ {};
        };
      };
    };
    if (debits > credits) 0 else credits - debits;
  };

  // Get full wallet ledger
  public func getWalletLedger(
    wallet      : Map.Map<Nat, MTypes.WalletEntry>,
    apartmentId : Common.ApartmentId,
  ) : [MTypes.WalletEntry] {
    var result : [MTypes.WalletEntry] = [];
    for ((_, e) in wallet.entries()) {
      if (e.apartmentId == apartmentId) {
        result := result.concat([e]);
      };
    };
    result;
  };

  // Add a correction entry referencing an original wallet entry (immutable audit trail)
  public func addCorrection(
    wallet        : Map.Map<Nat, MTypes.WalletEntry>,
    idCounter     : { var next : Nat },
    originalId    : Nat,
    reason        : Text,
    correctedAmount : ?Nat,
    note          : Text,
    requestedBy   : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (wallet.get(originalId)) {
      case null #err("Original wallet entry not found");
      case (?orig) {
        let id = idCounter.next;
        idCounter.next += 1;
        let amount = switch (correctedAmount) {
          case (?a) a;
          case null orig.amount;
        };
        let entry : MTypes.WalletEntry = {
          id;
          apartmentId   = orig.apartmentId;
          entryType     = #Correction;
          amount;
          flatId        = orig.flatId;
          purpose       = reason;
          utrNumber     = null;
          approvedBy    = [requestedBy];
          status        = #Executed;
          createdAt     = Time.now();
          isPermanent   = true;
          correctionOf  = ?originalId;
          correctionNote = ?note;
        };
        wallet.add(id, entry);
        #ok("Correction entry created with id " # debug_show(id));
      };
    };
  };

  // Reject a pending debit entry (SuperAdmin / FlatAdmin)
  public func rejectDebit(
    wallet     : Map.Map<Nat, MTypes.WalletEntry>,
    debitId    : Nat,
    reason     : Text,
    rejectedBy : Common.UserId,
  ) : Common.Result<(), Text> {
    switch (wallet.get(debitId)) {
      case null #err("Wallet entry not found");
      case (?entry) {
        switch (entry.status) {
          case (#Pending) {
            wallet.add(debitId, { entry with
              status        = #Rejected;
              correctionNote = ?reason;
              approvedBy    = entry.approvedBy.concat([rejectedBy]);
            });
            #ok(());
          };
          case _ #err("Entry is not pending — cannot reject");
        };
      };
    };
  };
}
