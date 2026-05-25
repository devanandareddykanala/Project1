import Time "mo:core/Time";
import Common "../types/common";
import ITypes "../types/issues";
import Map "mo:core/Map";

module {
  // Raise an issue
  public func raiseIssue(
    issues      : Map.Map<Nat, ITypes.Issue>,
    idCounter   : { var next : Nat },
    apartmentId : Common.ApartmentId,
    flatId      : Common.FlatId,
    title       : Text,
    description : Text,
    category    : ITypes.IssueCategory,
    raisedBy    : Common.UserId,
  ) : Common.Result<Text, Text> {
    let id = idCounter.next;
    idCounter.next += 1;
    let now = Time.now();
    let issue : ITypes.Issue = {
      id;
      apartmentId;
      flatId;
      title;
      description;
      category;
      status = #Open;
      raisedBy;
      assignedTo = null;
      resolvedAt = null;
      createdAt = now;
      updatedAt = now;
    };
    issues.add(id, issue);
    #ok("Issue raised with id " # debug_show(id));
  };

  // Update issue status
  public func updateIssueStatus(
    issues  : Map.Map<Nat, ITypes.Issue>,
    issueId : Nat,
    status  : ITypes.IssueStatus,
    _updater : Common.UserId,
  ) : Common.Result<Text, Text> {
    switch (issues.get(issueId)) {
      case null #err("Issue not found");
      case (?issue) {
        let resolvedAt = switch (status) {
          case (#Resolved) ?Time.now();
          case _ issue.resolvedAt;
        };
        issues.add(issueId, { issue with status; resolvedAt; updatedAt = Time.now() });
        #ok("Issue status updated");
      };
    };
  };

  // Get all issues for an apartment
  public func getIssues(
    issues      : Map.Map<Nat, ITypes.Issue>,
    apartmentId : Common.ApartmentId,
  ) : [ITypes.Issue] {
    var result : [ITypes.Issue] = [];
    for ((_, i) in issues.entries()) {
      if (i.apartmentId == apartmentId) {
        result := result.concat([i]);
      };
    };
    result;
  };

  // Get issues by flat
  public func getIssuesByFlat(
    issues : Map.Map<Nat, ITypes.Issue>,
    flatId : Common.FlatId,
  ) : [ITypes.Issue] {
    var result : [ITypes.Issue] = [];
    for ((_, i) in issues.entries()) {
      if (i.flatId == flatId) {
        result := result.concat([i]);
      };
    };
    result;
  };
}
