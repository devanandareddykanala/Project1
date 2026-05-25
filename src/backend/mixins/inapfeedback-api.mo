import Map      "mo:core/Map";
import Time     "mo:core/Time";
import Nat      "mo:core/Nat";
import FeedbackT "../types/feedback";
import AuthT     "../types/auth";

mixin (
  users           : Map.Map<Principal, AuthT.User>,
  inappFeedbacks  : Map.Map<Text, FeedbackT.FeedbackRecord>,
  ids             : { var next : Nat },
) {
  /// Submit in-app feedback.
  /// feedbackType: "suggestion" | "bug" | "compliment"
  public shared ({ caller }) func submitInAppFeedback(
    feedbackType : Text,
    message      : Text,
    screenshot   : ?Blob,
  ) : async { #ok : (); #err : Text } {
    let isValid = feedbackType == "suggestion" or feedbackType == "bug" or feedbackType == "compliment";
    if (not isValid) return #err("Invalid feedback type. Use: suggestion, bug, or compliment");
    let fbId = "FB" # ids.next.toText();
    ids.next += 1;
    let record : FeedbackT.FeedbackRecord = {
      id           = fbId;
      userId       = caller.toText();
      feedbackType;
      message;
      submittedAt  = Time.now();
      screenshot;
    };
    inappFeedbacks.add(fbId, record);
    #ok(());
  };

  /// Retrieve feedback records (Founder/CoFounder only).
  /// Optional filter: "suggestion" | "bug" | "compliment"
  public query ({ caller }) func getInAppFeedback(
    filter : ?Text,
  ) : async [FeedbackT.FeedbackRecord] {
    let isAuthorized = switch (users.get(caller)) {
      case null false;
      case (?u) switch (u.role) {
        case (#Founder or #CoFounder) true;
        case _ false;
      };
    };
    if (not isAuthorized) return [];
    let all = inappFeedbacks.values().toArray();
    switch (filter) {
      case null  all;
      case (?f)  all.filter(func(fb : FeedbackT.FeedbackRecord) : Bool { fb.feedbackType == f });
    };
  };
}
