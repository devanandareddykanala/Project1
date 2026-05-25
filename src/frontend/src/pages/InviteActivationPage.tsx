import { DPDPConsentScreen } from "@/components/DPDPConsentScreen";
import {
  createActor,
  registerWithInvite,
  useActor,
  validateInviteCode,
} from "@/lib/backend";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DevelvynLogo } from "../components/DevelvynLogo";

const C = {
  accent: "#22C55E",
  deep: "#16A34A",
  text: "#111827",
  muted: "#6B7280",
  border: "#DCFCE7",
  surface: "#F8F9FA",
};

type InviteInfo = {
  apartmentName?: string;
  role?: string;
  valid: boolean;
  expired?: boolean;
};

export function InviteActivationPage() {
  const navigate = useNavigate();
  // useSearch must be called unconditionally at the top level
  const searchParams = useSearch({ strict: false }) as Record<string, string>;
  const urlCode = (searchParams?.code ?? "").toUpperCase();

  const { actor } = useActor(createActor);

  const [code, setCode] = useState(urlCode);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);

  const [fullName, setFullName] = useState("");
  const [consent, setConsent] = useState(false);
  const [showDPDP, setShowDPDP] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [codeValidating, setCodeValidating] = useState(false);

  const isWatchman =
    inviteInfo?.role?.toLowerCase().includes("watchman") ?? false;
  const canSubmit =
    inviteInfo?.valid === true && fullName.trim().length > 0 && consent;

  // Validate invite on load if code in URL
  useEffect(() => {
    if (urlCode && actor) {
      validateCode(urlCode.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, urlCode]);

  const validateCode = async (c: string) => {
    if (c.length < 6 || !actor) return;
    setCodeValidating(true);
    try {
      const result = await validateInviteCode(actor, c);
      if (result.isValid) {
        setInviteInfo({ valid: true, role: result.role });
      } else {
        setInviteInfo({ valid: false, expired: true });
      }
    } catch {
      setInviteInfo({ valid: false, expired: true });
    } finally {
      setCodeValidating(false);
      setInviteChecked(true);
    }
  };

  const handleCodeChange = (v: string) => {
    const upper = v
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setCode(upper);
    setInviteInfo(null);
    setInviteChecked(false);
  };

  const handleCodeBlur = () => {
    if (code.length === 6) validateCode(code);
  };

  const handleActivate = async () => {
    setError("");
    if (!code) {
      setError("Enter a valid invite code");
      return;
    }
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!consent) {
      setError("Please accept the privacy policy to continue");
      return;
    }
    if (!actor) {
      setError("Connecting to server… please try again");
      return;
    }
    if (inviteInfo?.expired) {
      setError(
        "This code has expired. Ask your Super Admin to send a new one.",
      );
      return;
    }

    setLoading(true);
    try {
      await registerWithInvite(actor, code, fullName.trim(), "");
      setSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("expired") || msg.includes("invalid")) {
        setError(
          "This code has expired. Ask your Super Admin to send a new one.",
        );
      } else if (msg.includes("already")) {
        setError("This account is already registered. Sign in instead.");
      } else {
        setError("Could not activate your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show DPDP full screen if watchman (extra consent needed)
  if (showDPDP) {
    return (
      <DPDPConsentScreen
        consentMode="watchman"
        onAccept={() => {
          setConsent(true);
          setShowDPDP(false);
        }}
        onBack={() => setShowDPDP(false)}
      />
    );
  }

  if (success) {
    return (
      <div
        className="min-h-screen bg-white flex flex-col items-center justify-center px-6"
        data-ocid="invite.success_state"
      >
        <DevelvynLogo size={56} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "#111827" }}>
          Account Activated!
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "#6B7280" }}>
          Your account is ready. Please login with Internet Identity to
          continue.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="w-full max-w-sm text-white font-semibold py-4 rounded-xl text-base"
          style={{ backgroundColor: "#22C55E" }}
          data-ocid="invite.go_to_login_button"
        >
          Login with Internet Identity
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-10"
      data-ocid="invite.page"
    >
      <DevelvynLogo size={56} />
      <h1 className="text-xl font-bold mb-1" style={{ color: C.text }}>
        You've Been Invited
      </h1>
      {inviteInfo?.apartmentName ? (
        <p className="text-sm mb-2" style={{ color: C.muted }}>
          Join{" "}
          <span className="font-semibold" style={{ color: C.text }}>
            {inviteInfo.apartmentName}
          </span>
        </p>
      ) : (
        <p className="text-sm mb-2" style={{ color: C.muted }}>
          Activate your account with the invite code
        </p>
      )}
      <p className="text-xs mb-8" style={{ color: C.muted }}>
        Develvyn Technologies Pvt Ltd
      </p>

      <div className="w-full max-w-sm">
        {/* Invite code */}
        <div className="mb-4">
          <label
            htmlFor="invite-code"
            className="block text-sm font-medium mb-1.5"
            style={{ color: C.text }}
          >
            Invite Code
          </label>
          <div className="relative">
            <input
              id="invite-code"
              type="text"
              placeholder="6-character code (e.g. XK9F2M)"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onBlur={handleCodeBlur}
              maxLength={6}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none tracking-widest uppercase transition-colors"
              style={{
                borderColor: code.length === 6 ? C.accent : C.border,
                color: C.text,
                backgroundColor: "#FFFFFF",
              }}
              data-ocid="invite.code_input"
            />
            {codeValidating && (
              <span
                className="absolute right-4 top-3.5 text-xs"
                style={{ color: C.muted }}
              >
                Checking…
              </span>
            )}
            {inviteChecked && inviteInfo?.valid && (
              <span
                className="absolute right-4 top-3.5 text-xs"
                style={{ color: C.accent }}
              >
                ✓ Valid
              </span>
            )}
            {inviteChecked && !inviteInfo?.valid && (
              <span
                className="absolute right-4 top-3.5 text-xs"
                style={{ color: "#EF4444" }}
              >
                Invalid
              </span>
            )}
          </div>
        </div>

        {/* Full name */}
        <div className="mb-4">
          <label
            htmlFor="invite-fullname"
            className="block text-sm font-medium mb-1.5"
            style={{ color: C.text }}
          >
            Full Name
          </label>
          <input
            id="invite-fullname"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            style={{
              borderColor: fullName ? C.accent : C.border,
              color: C.text,
              backgroundColor: "#FFFFFF",
            }}
            data-ocid="invite.name_input"
          />
        </div>

        {/* DPDP Consent checkbox */}
        {isWatchman ? (
          <button
            type="button"
            onClick={() => setShowDPDP(true)}
            className="w-full flex gap-3 items-start text-left p-3 rounded-xl border mb-4 transition-colors"
            style={{
              borderColor: consent ? C.accent : C.border,
              backgroundColor: consent ? "#F0FDF4" : "#FFFFFF",
            }}
            data-ocid="invite.consent_checkbox"
          >
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                borderColor: consent ? C.accent : "#D1D5DB",
                backgroundColor: consent ? C.accent : "transparent",
              }}
            >
              {consent && (
                <span className="text-white text-xs font-bold">✓</span>
              )}
            </div>
            <span className="text-sm leading-relaxed" style={{ color: C.text }}>
              I agree to the Privacy Policy and additional data consent for
              security staff.
              {!consent && (
                <span
                  className="block text-xs mt-0.5"
                  style={{ color: C.accent }}
                >
                  Tap to review & accept →
                </span>
              )}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConsent(!consent)}
            className="w-full flex gap-3 items-start text-left p-3 rounded-xl border mb-4 transition-colors"
            style={{
              borderColor: consent ? C.accent : C.border,
              backgroundColor: consent ? "#F0FDF4" : "#FFFFFF",
            }}
            data-ocid="invite.consent_checkbox"
          >
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                borderColor: consent ? C.accent : "#D1D5DB",
                backgroundColor: consent ? C.accent : "transparent",
              }}
            >
              {consent && (
                <span className="text-white text-xs font-bold">✓</span>
              )}
            </div>
            <span className="text-sm leading-relaxed" style={{ color: C.text }}>
              I agree to the{" "}
              <Link
                to="/privacy-policy"
                className="underline"
                style={{ color: C.accent }}
                onClick={(e) => e.stopPropagation()}
                data-ocid="invite.privacy_policy_link"
              >
                Privacy Policy
              </Link>{" "}
              and consent to my data being processed by Develvyn Technologies
              Pvt Ltd
            </span>
          </button>
        )}

        {error && (
          <p
            className="text-xs text-center mb-3"
            style={{ color: "#EF4444" }}
            data-ocid="invite.error_state"
          >
            {error}
          </p>
        )}

        {inviteChecked && inviteInfo?.expired && (
          <p
            className="text-xs text-center mb-3"
            style={{ color: "#EF4444" }}
            data-ocid="invite.expired_state"
          >
            This code has expired. Ask your Super Admin to send a new one.
          </p>
        )}

        <button
          type="button"
          onClick={handleActivate}
          disabled={loading || !canSubmit}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-4 transition-colors"
          style={{
            backgroundColor: canSubmit && !loading ? C.accent : "#D1D5DB",
          }}
          data-ocid="invite.submit_button"
        >
          {loading ? "Activating…" : "Activate Account"}
        </button>

        <p className="text-sm text-center" style={{ color: C.muted }}>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium"
            style={{ color: C.accent }}
            data-ocid="invite.signin_link"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
