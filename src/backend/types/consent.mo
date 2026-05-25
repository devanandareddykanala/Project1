// DPDP consent types
module {
  public type ConsentRecord = {
    principal                : Principal;   // II principal of the consenting user
    phone                    : Text;
    generalConsent           : Bool;
    generalConsentAt         : Int;
    watchmanPhotoIdConsent   : ?Bool;
    watchmanGpsConsent       : ?Bool;
    watchmanAttendanceConsent: ?Bool;
    deviceInfo               : Text;
  };
}
