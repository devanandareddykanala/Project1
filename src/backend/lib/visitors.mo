import Time "mo:core/Time";
import Common "../types/common";
import VTypes "../types/visitors";
import Map "mo:core/Map";

module {
  // Log a visitor
  public func logVisitor(
    visitors    : Map.Map<Nat, VTypes.VisitorEntry>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    flatId      : ?Common.FlatId,
    enteredBy   : Common.UserId,
    name        : Text,
    visitorType : VTypes.VisitorType,
    note        : Text,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let entry : VTypes.VisitorEntry = {
      id;
      apartmentId;
      flatId;
      visitorName = name;
      visitorType;
      note;
      enteredBy;
      enteredAt = Time.now();
    };
    visitors.add(id, entry);
    #ok("Visitor logged");
  };

  // Get visitor log filtered by apartment and optional flat
  public func getVisitorLog(
    visitors     : Map.Map<Nat, VTypes.VisitorEntry>,
    apartmentId  : Common.ApartmentId,
    flatIdFilter : ?Common.FlatId,
  ) : [VTypes.VisitorEntry] {
    var result : [VTypes.VisitorEntry] = [];
    for ((_, v) in visitors.entries()) {
      if (v.apartmentId == apartmentId) {
        switch (flatIdFilter) {
          case null { result := result.concat([v]) };
          case (?fid) {
            switch (v.flatId) {
              case (?vfid) {
                if (vfid == fid) result := result.concat([v]);
              };
              case null {};
            };
          };
        };
      };
    };
    result;
  };
}
