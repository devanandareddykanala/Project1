import Map        "mo:core/Map";
import ConsentT   "../types/consent";

mixin (
  consentRecords : Map.Map<Text, ConsentT.ConsentRecord>,
) {
  /// Record a DPDP consent for the given phone number.
  /// consentType: "general" | "watchman_photo_id" | "watchman_gps" | "watchman_attendance"
  public shared ({ caller }) func recordConsent(
    phone       : Text,
    consentType : Text,
    timestamp   : Int,
    deviceInfo  : Text,
  ) : async { #ok : (); #err : Text } {
    // Return friendly error if consent already recorded for this principal+type
    switch (consentRecords.get(phone)) {
      case (?existing) {
        let alreadyGiven = switch (consentType) {
          case "general"              existing.generalConsent;
          case "watchman_photo_id"    existing.watchmanPhotoIdConsent == ?true;
          case "watchman_gps"         existing.watchmanGpsConsent == ?true;
          case "watchman_attendance"  existing.watchmanAttendanceConsent == ?true;
          case _                      false;
        };
        if (alreadyGiven) return #err("You have already given consent.");
      };
      case null {};
    };
    let base : ConsentT.ConsentRecord = switch (consentRecords.get(phone)) {
      case (?r) r;
      case null {
        {
          principal                 = caller;
          phone;
          generalConsent            = false;
          generalConsentAt          = 0;
          watchmanPhotoIdConsent    = null;
          watchmanGpsConsent        = null;
          watchmanAttendanceConsent = null;
          deviceInfo;
        }
      };
    };
    let updated = switch (consentType) {
      case "general" {
        { base with
          principal        = caller;
          generalConsent   = true;
          generalConsentAt = timestamp;
          deviceInfo;
        }
      };
      case "watchman_photo_id" {
        { base with principal = caller; watchmanPhotoIdConsent = ?true; deviceInfo }
      };
      case "watchman_gps" {
        { base with principal = caller; watchmanGpsConsent = ?true; deviceInfo }
      };
      case "watchman_attendance" {
        { base with principal = caller; watchmanAttendanceConsent = ?true; deviceInfo }
      };
      case _ return #err("Unknown consent type: " # consentType);
    };
    consentRecords.add(phone, updated);
    #ok(());
  };

  /// Retrieve the consent record for a phone number.
  public query func getConsentRecord(phone : Text) : async ?ConsentT.ConsentRecord {
    consentRecords.get(phone);
  };
}
