import Time "mo:core/Time";
import Common "../types/common";
import AptTypes "../types/apartment";
import Map "mo:core/Map";

module {
  // Create a new apartment
  public func createApartment(
    apartments   : Map.Map<Common.ApartmentId, AptTypes.Apartment>,
    idCounter    : { var next : Nat },
    name         : Text,
    address      : Text,
    superAdminId : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let apt : AptTypes.Apartment = {
      id;
      name;
      address;
      superAdminId;
      inchargeId = null;
      upiId = "";
      upiQrData = "";
      createdAt = Time.now();
      subscriptionStatus = #Active;
    };
    apartments.add(id, apt);
    #ok("Apartment created with id " # debug_show(id));
  };

  // Update UPI details
  public func updateUpi(
    apartments  : Map.Map<Common.ApartmentId, AptTypes.Apartment>,
    apartmentId : Common.ApartmentId,
    upiId       : Text,
    upiQrData   : Text,
  ) : Common.Result<Text, Text> {
    switch (apartments.get(apartmentId)) {
      case null #err("Apartment not found");
      case (?apt) {
        apartments.add(apartmentId, { apt with upiId; upiQrData });
        #ok("UPI updated");
      };
    };
  };

  // Get apartment by id
  public func getApartment(
    apartments  : Map.Map<Common.ApartmentId, AptTypes.Apartment>,
    apartmentId : Common.ApartmentId,
  ) : ?AptTypes.Apartment {
    apartments.get(apartmentId);
  };

  // Create flat
  public func createFlat(
    flats       : Map.Map<Common.FlatId, AptTypes.Flat>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    flatNumber  : Text,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let flat : AptTypes.Flat = {
      id;
      apartmentId;
      flatNumber;
      ownerId = null;
      tenantId = null;
      status = #Occupied;
    };
    flats.add(id, flat);
    #ok("Flat created with id " # debug_show(id));
  };

  // Get all flats for an apartment
  public func getFlats(
    flats       : Map.Map<Common.FlatId, AptTypes.Flat>,
    apartmentId : Common.ApartmentId,
  ) : [AptTypes.Flat] {
    var result : [AptTypes.Flat] = [];
    for ((_, flat) in flats.entries()) {
      if (flat.apartmentId == apartmentId) {
        result := result.concat([flat]);
      };
    };
    result;
  };

  // Assign incharge
  public func assignIncharge(
    apartments      : Map.Map<Common.ApartmentId, AptTypes.Apartment>,
    inchargeRecords : Map.Map<Nat, AptTypes.InchargeRecord>,
    idCounter       : { var next : Nat },
    apartmentId     : Common.ApartmentId,
    userId          : Common.UserId,
    startDate       : Common.Timestamp,
  ) : Common.Result<Text, Text> {
    switch (apartments.get(apartmentId)) {
      case null #err("Apartment not found");
      case (?apt) {
        apartments.add(apartmentId, { apt with inchargeId = ?userId });
        let id = idCounter.next;
        idCounter.next += 1;
        let rec : AptTypes.InchargeRecord = {
          id;
          apartmentId;
          userId;
          startDate;
          endDate = null;
          handoverNotes = "";
          handoverChecklist = {
            gateKeyTransferred = false;
            ledgerReviewed = false;
            upiUpdated = false;
            pendingIssuesNoted = false;
          };
          isActive = true;
        };
        inchargeRecords.add(id, rec);
        #ok("Incharge assigned");
      };
    };
  };

  // Initiate handover (updates current active record)
  public func initiateHandover(
    inchargeRecords : Map.Map<Nat, AptTypes.InchargeRecord>,
    apartmentId     : Common.ApartmentId,
    notes           : Text,
    checklist       : AptTypes.HandoverChecklist,
  ) : Common.Result<Text, Text> {
    var found = false;
    for ((id, rec) in inchargeRecords.entries()) {
      if (rec.apartmentId == apartmentId and rec.isActive) {
        inchargeRecords.add(id, { rec with handoverNotes = notes; handoverChecklist = checklist });
        found := true;
      };
    };
    if (found) #ok("Handover initiated") else #err("No active incharge record found");
  };

  // Accept handover (closes old record, opens new)
  public func acceptHandover(
    apartments      : Map.Map<Common.ApartmentId, AptTypes.Apartment>,
    inchargeRecords : Map.Map<Nat, AptTypes.InchargeRecord>,
    idCounter       : { var next : Nat },
    apartmentId     : Common.ApartmentId,
    newInchargeId   : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (apartments.get(apartmentId)) {
      case null #err("Apartment not found");
      case (?apt) {
        // Close old active record
        for ((id, rec) in inchargeRecords.entries()) {
          if (rec.apartmentId == apartmentId and rec.isActive) {
            inchargeRecords.add(id, { rec with isActive = false; endDate = ?Time.now() });
          };
        };
        // Create new record
        let newId = idCounter.next;
        idCounter.next += 1;
        let newRec : AptTypes.InchargeRecord = {
          id = newId;
          apartmentId;
          userId = newInchargeId;
          startDate = Time.now();
          endDate = null;
          handoverNotes = "";
          handoverChecklist = {
            gateKeyTransferred = false;
            ledgerReviewed = false;
            upiUpdated = false;
            pendingIssuesNoted = false;
          };
          isActive = true;
        };
        inchargeRecords.add(newId, newRec);
        apartments.add(apartmentId, { apt with inchargeId = ?newInchargeId });
        #ok("Handover accepted");
      };
    };
  };

  // Get incharge history
  public func getInchargeHistory(
    inchargeRecords : Map.Map<Nat, AptTypes.InchargeRecord>,
    apartmentId     : Common.ApartmentId,
  ) : [AptTypes.InchargeRecord] {
    var result : [AptTypes.InchargeRecord] = [];
    for ((_, rec) in inchargeRecords.entries()) {
      if (rec.apartmentId == apartmentId) {
        result := result.concat([rec]);
      };
    };
    result;
  };
}
