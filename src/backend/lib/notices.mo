import Time "mo:core/Time";
import Common "../types/common";
import NTypes "../types/notices";
import Map "mo:core/Map";

module {
  // Post a notice
  public func postNotice(
    notices     : Map.Map<Nat, NTypes.Notice>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    title       : Text,
    content     : Text,
    priority    : NTypes.Priority,
    postedBy    : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let notice : NTypes.Notice = {
      id;
      apartmentId;
      title;
      content;
      postedBy;
      postedAt = Time.now();
      priority;
      acknowledgedBy = [];
    };
    notices.add(id, notice);
    #ok("Notice posted");
  };

  // Acknowledge a notice
  public func acknowledgeNotice(
    notices  : Map.Map<Nat, NTypes.Notice>,
    noticeId : Nat,
    userId   : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (notices.get(noticeId)) {
      case null #err("Notice not found");
      case (?n) {
        let alreadyAck = n.acknowledgedBy.find(func(id : Common.UserId) : Bool { id == userId });
        switch (alreadyAck) {
          case (?_) #ok("Already acknowledged");
          case null {
            notices.add(noticeId, { n with acknowledgedBy = n.acknowledgedBy.concat([userId]) });
            #ok("Acknowledged");
          };
        };
      };
    };
  };

  // Get all notices for an apartment
  public func getNotices(
    notices     : Map.Map<Nat, NTypes.Notice>,
    apartmentId : Common.ApartmentId,
  ) : [NTypes.Notice] {
    var result : [NTypes.Notice] = [];
    for ((_, n) in notices.entries()) {
      if (n.apartmentId == apartmentId) {
        result := result.concat([n]);
      };
    };
    result;
  };

  // Count unread (unacknowledged) notices for a user
  public func getUnreadCount(
    notices     : Map.Map<Nat, NTypes.Notice>,
    apartmentId : Common.ApartmentId,
    userId      : Common.UserId,
  ) : Nat {
    var count = 0;
    for ((_, n) in notices.entries()) {
      if (n.apartmentId == apartmentId) {
        let ack = n.acknowledgedBy.find(func(id : Common.UserId) : Bool { id == userId });
        switch (ack) {
          case null { count += 1 };
          case _ {};
        };
      };
    };
    count;
  };
}
