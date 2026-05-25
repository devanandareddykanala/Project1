import Debug "mo:core/Debug";
import Common "../types/common";
import ITypes "../types/issues";
import AuthTypes "../types/auth";
import Map "mo:core/Map";
import AuthLib "../lib/auth";
import IssuesLib "../lib/issues";

mixin (
  users     : Map.Map<Principal, AuthTypes.User>,
  issues    : Map.Map<Nat, ITypes.Issue>,
  issIdCounter : { var next : Nat },
) {
  // Raise an issue
  public shared ({ caller }) func raiseIssue(
    flatId      : Common.FlatId,
    apartmentId : Common.ApartmentId,
    title       : Text,
    description : Text,
    category    : ITypes.IssueCategory,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge]);
    IssuesLib.raiseIssue(issues, issIdCounter, apartmentId, flatId, title, description, category, user.id);
  };

  // Update issue status
  public shared ({ caller }) func updateIssueStatus(
    issueId : Nat,
    status  : ITypes.IssueStatus,
  ) : async Common.Result<Text, Text> {
    let user = AuthLib.assertRole(users, caller, [#SuperAdmin, #RotatingIncharge, #FlatAdmin]);
    IssuesLib.updateIssueStatus(issues, issueId, status, user.id);
  };

  // Get all issues for an apartment
  public shared query ({ caller }) func getIssues(
    apartmentId : Common.ApartmentId,
  ) : async [ITypes.Issue] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge]);
    IssuesLib.getIssues(issues, apartmentId);
  };

  // Get issues for a specific flat
  public shared query ({ caller }) func getIssuesByFlat(
    flatId : Common.FlatId,
  ) : async [ITypes.Issue] {
    ignore AuthLib.assertRole(users, caller, [#SuperAdmin, #FlatAdmin, #FamilyMember, #RotatingIncharge]);
    IssuesLib.getIssuesByFlat(issues, flatId);
  };
}
