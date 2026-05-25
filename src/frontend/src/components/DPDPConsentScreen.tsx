import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Circle } from "lucide-react";
import { useState } from "react";

const B = {
  accent: "#22C55E",
  deep: "#16A34A",
  text: "#111827",
  muted: "#6B7280",
  border: "#DCFCE7",
  surface: "#F8F9FA",
};

type ConsentMode = "general" | "watchman" | "super_admin";

interface DPDPConsentScreenProps {
  consentMode?: ConsentMode;
  /** @deprecated use consentMode */
  role?: ConsentMode;
  onAccept: () => void;
  onBack: () => void;
}

export function DPDPConsentScreen({
  consentMode,
  role,
  onAccept,
  onBack,
}: DPDPConsentScreenProps) {
  const navigate = useNavigate();
  const effectiveMode = consentMode ?? role ?? "general";
  const isWatchman = effectiveMode === "watchman";

  // Step management: 1=DPDP, 2=Terms, 3=Watchman additional
  const [step, setStep] = useState(1);
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [watchmanIdConsent, setWatchmanIdConsent] = useState(false);
  const [watchmanGpsConsent, setWatchmanGpsConsent] = useState(false);
  const [watchmanAttendanceConsent, setWatchmanAttendanceConsent] =
    useState(false);

  // Legacy alias
  const generalConsent = dpdpConsent;
  const setGeneralConsent = setDpdpConsent;
  const watchmanStep = step === 3;

  const _canContinueDpdp = dpdpConsent;
  const canContinueTerms = termsConsent;
  const canContinueGeneral = dpdpConsent; // kept for compat
  const canContinueWatchman =
    watchmanIdConsent && watchmanGpsConsent && watchmanAttendanceConsent;

  const handleGeneralContinue = () => {
    setStep(2);
  };

  const handleTermsContinue = () => {
    if (!isWatchman) {
      onAccept();
      return;
    }
    setStep(3);
  };

  const handleWatchmanContinue = () => {
    onAccept();
  };

  /* ---- Watchman additional consent ---- */
  if (watchmanStep) {
    return (
      <div
        className="min-h-screen bg-white flex flex-col"
        data-ocid="dpdp.watchman_consent_page"
      >
        <div className="flex flex-col items-center pt-14 pb-6 px-6 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#F0FDF4" }}
          >
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: B.text }}>
            Additional Data Collection
          </h1>
          <p className="text-sm mt-1" style={{ color: B.muted }}>
            Required for security staff verification
          </p>
          <p className="text-xs mt-1" style={{ color: B.muted }}>
            Develvyn Technologies Pvt Ltd
          </p>
        </div>

        <div className="flex-1 px-6 flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: B.text }}>
            As a watchman, we collect additional information to ensure building
            security and accurate record-keeping. Each item below requires your
            individual consent.
          </p>

          <ConsentCheckbox
            checked={watchmanIdConsent}
            onChange={setWatchmanIdConsent}
            ocid="dpdp.watchman_id_checkbox"
          >
            I consent to providing a government-issued photo ID (Aadhaar, Voter
            ID, or Driving Licence) for identity verification.
          </ConsentCheckbox>

          <ConsentCheckbox
            checked={watchmanGpsConsent}
            onChange={setWatchmanGpsConsent}
            ocid="dpdp.watchman_gps_checkbox"
          >
            I consent to my GPS location being recorded when I start and end my
            duty shift.
          </ConsentCheckbox>

          <ConsentCheckbox
            checked={watchmanAttendanceConsent}
            onChange={setWatchmanAttendanceConsent}
            ocid="dpdp.watchman_attendance_checkbox"
          >
            I consent to my attendance data being recorded for salary
            calculation purposes.
          </ConsentCheckbox>

          <div className="text-xs mt-1" style={{ color: B.muted }}>
            Questions? Email{" "}
            <a
              href="mailto:support@develvyntechnologies.com"
              className="underline"
              style={{ color: B.accent }}
            >
              support@develvyntechnologies.com
            </a>
          </div>

          <button
            type="button"
            onClick={handleWatchmanContinue}
            disabled={!canContinueWatchman}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-smooth mt-1"
            style={{
              backgroundColor: canContinueWatchman ? B.accent : "#D1D5DB",
              color: "#FFF",
            }}
            data-ocid="dpdp.watchman_continue_button"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm font-medium text-center"
            style={{ color: B.muted }}
            data-ocid="dpdp.watchman_back_button"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  /* ---- Step 2: Terms & Conditions acceptance ---- */
  if (step === 2) {
    return (
      <div
        className="min-h-screen bg-white flex flex-col"
        data-ocid="dpdp.terms_consent_page"
      >
        <div className="flex flex-col items-center pt-14 pb-6 px-6 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#F0FDF4" }}
          >
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: B.text }}>
            Terms &amp; Conditions
          </h1>
          <p className="text-sm mt-1" style={{ color: B.muted }}>
            Step 2 of {isWatchman ? 3 : 2}
          </p>
        </div>

        <div className="flex-1 px-6 flex flex-col gap-4 pb-8">
          <p className="text-sm leading-relaxed" style={{ color: B.text }}>
            By using Develvyn, you agree to use it only for its intended
            purpose. Do not trigger false SOS alerts. All financial records are
            permanent. You must be 18+ to register.
          </p>

          <div
            className="flex flex-col gap-1.5 text-sm"
            style={{ color: B.muted }}
          >
            <p>✅ No false SOS alerts</p>
            <p>✅ No misuse of visitor log</p>
            <p>✅ Financial records are permanent — correction entry only</p>
            <p>✅ Governed by Indian law</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/terms-and-conditions" })}
              className="text-sm underline"
              style={{ color: B.accent }}
              data-ocid="dpdp.terms_link"
            >
              Read full Terms &amp; Conditions
            </button>
            <span style={{ color: B.muted }}>·</span>
            <button
              type="button"
              onClick={() => navigate({ to: "/cancel-refund-policy" })}
              className="text-sm underline"
              style={{ color: B.accent }}
              data-ocid="dpdp.cancel_refund_link"
            >
              Cancel &amp; Refund Policy
            </button>
          </div>

          <ConsentCheckbox
            checked={termsConsent}
            onChange={setTermsConsent}
            ocid="dpdp.terms_consent_checkbox"
          >
            I agree to the Terms &amp; Conditions and Cancel &amp; Refund Policy
            of Develvyn Technologies Pvt Ltd.
          </ConsentCheckbox>

          <button
            type="button"
            onClick={handleTermsContinue}
            disabled={!canContinueTerms}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-smooth mt-1"
            style={{
              backgroundColor: canContinueTerms ? B.accent : "#D1D5DB",
              color: "#FFF",
            }}
            data-ocid="dpdp.terms_continue_button"
          >
            {isWatchman ? "Continue to Additional Consent" : "Get Started"}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm font-medium text-center"
            style={{ color: B.muted }}
            data-ocid="dpdp.terms_back_button"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  /* ---- Step 1: DPDP general consent ---- */
  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      data-ocid="dpdp.consent_page"
    >
      <div className="flex flex-col items-center pt-14 pb-6 px-6 text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <span className="text-2xl">🔐</span>
        </div>
        <h1 className="text-xl font-bold" style={{ color: B.text }}>
          Your Data &amp; Privacy
        </h1>
        <p className="text-sm mt-1" style={{ color: B.muted }}>
          Develvyn Technologies Pvt Ltd
        </p>
      </div>

      <div className="flex-1 px-6 flex flex-col gap-4 pb-8">
        {/* Data collected */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: B.surface,
            border: `1px solid ${B.border}`,
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: B.muted }}
          >
            What we collect
          </p>
          <div className="flex flex-col gap-2">
            {[
              ["Internet Identity", "Your biometric login anchor"],
              ["Name", "For your profile"],
              ["Flat number", "For apartment management"],
            ].map(([item, reason]) => (
              <div key={item} className="flex gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: B.accent }}
                />
                <p className="text-sm" style={{ color: B.text }}>
                  <span className="font-medium">{item}</span>
                  <span style={{ color: B.muted }}> — {reason}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm" style={{ color: B.muted }}>
          <p>🔒 Your data is stored securely for as long as you use the app.</p>
          <p>❌ You can delete your account anytime in Settings.</p>
          <p>
            📧 Questions? Email{" "}
            <a
              href="mailto:support@develvyntechnologies.com"
              className="underline"
              style={{ color: B.accent }}
            >
              support@develvyntechnologies.com
            </a>
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/privacy-policy" })}
            className="text-left underline text-sm"
            style={{ color: B.accent }}
            data-ocid="dpdp.privacy_policy_link"
          >
            Read our full Privacy Policy
          </button>
        </div>

        {/* Active consent checkbox */}
        <ConsentCheckbox
          checked={generalConsent}
          onChange={setGeneralConsent}
          ocid="dpdp.general_consent_checkbox"
        >
          I have read and agree to the Privacy Policy and consent to my personal
          data being processed by Develvyn Technologies Pvt Ltd.
        </ConsentCheckbox>

        <button
          type="button"
          onClick={handleGeneralContinue}
          disabled={!canContinueGeneral}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-smooth mt-1"
          style={{
            backgroundColor: canContinueGeneral ? B.accent : "#D1D5DB",
            color: "#FFF",
          }}
          data-ocid="dpdp.continue_button"
        >
          {isWatchman ? "Continue to Additional Consent" : "Continue"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-center"
          style={{ color: B.muted }}
          data-ocid="dpdp.back_button"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  children,
  ocid,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  ocid: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex gap-3 items-start text-left p-3 rounded-xl border transition-smooth"
      style={{
        borderColor: checked ? "#22C55E" : "#DCFCE7",
        backgroundColor: checked ? "#F0FDF4" : "#FFFFFF",
      }}
      data-ocid={ocid}
    >
      <div className="flex-shrink-0 mt-0.5">
        {checked ? (
          <CheckCircle size={18} style={{ color: "#22C55E" }} />
        ) : (
          <Circle size={18} style={{ color: "#D1D5DB" }} />
        )}
      </div>
      <span className="text-sm leading-relaxed" style={{ color: "#111827" }}>
        {children}
      </span>
    </button>
  );
}
