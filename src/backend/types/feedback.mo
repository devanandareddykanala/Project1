// In-app feedback types
module {
  public type FeedbackRecord = {
    id           : Text;
    userId       : Text;
    feedbackType : Text;
    message      : Text;
    submittedAt  : Int;
    screenshot   : ?Blob;
  };
}
