import { createActor, registerApartment, useActor } from "@/lib/backend";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DevelvynLogo } from "../components/DevelvynLogo";

const _C = {
  accent: "#22C55E",
  deep: "#16A34A",
  text: "#111827",
  muted: "#6B7280",
  border: "#DCFCE7",
  surface: "#F8F9FA",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);

  const [apartmentName, setApartmentName] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const canSubmit = apartmentName.trim() && name.trim() && consent;

  const handleCreate = async () => {
    setError("");
    if (!apartmentName.trim()) {
      setError("Apartment name is required");
      return;
    }
    if (!name.trim()) {
      setError("Your name is required");
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

    setLoading(true);
    try {
      await registerApartment(actor, apartmentName.trim(), "");
      setSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("already") || msg.includes("exists")) {
        setError("An account already exists. Sign in instead.");
      } else {
        setError("Could not register your apartment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen bg-white flex flex-col items-center justify-center px-6"
        data-ocid="register.success_state"
      >
        <DevelvynLogo size={56} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "#111827" }}>
          Registration Submitted
        </h2>
        <p className="text-sm text-center mb-6" style={{ color: "#6B7280" }}>
          Your apartment has been registered. You’ll be notified when confirmed
          by Develvyn.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="text-sm font-medium"
          style={{ color: "#22C55E" }}
          data-ocid="register.back_to_login_button"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-10"
      data-ocid="register.page"
    >
      <DevelvynLogo size={56} />
      <h1 className="text-xl font-bold mb-1" style={{ color: "#111827" }}>
        Register Your Apartment
      </h1>
      <p className="text-sm mb-8 text-center" style={{ color: "#6B7280" }}>
        Set up your apartment to get started
      </p>

      <div className="w-full max-w-sm">
        <div className="mb-4">
          <label
            htmlFor="reg-apt"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#111827" }}
          >
            Apartment Name
          </label>
          <input
            id="reg-apt"
            type="text"
            placeholder="e.g. Sunshine Residency, Block A"
            value={apartmentName}
            onChange={(e) => setApartmentName(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            style={{
              borderColor: apartmentName ? "#22C55E" : "#DCFCE7",
              color: "#111827",
              backgroundColor: "#FFFFFF",
            }}
            data-ocid="register.apartment_name_input"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="reg-name"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#111827" }}
          >
            Your Name
          </label>
          <input
            id="reg-name"
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            style={{
              borderColor: name ? "#22C55E" : "#DCFCE7",
              color: "#111827",
              backgroundColor: "#FFFFFF",
            }}
            data-ocid="register.name_input"
          />
        </div>
        {/* DPDP Consent */}
        <button
          type="button"
          onClick={() => setConsent(!consent)}
          className="w-full flex gap-3 items-start text-left p-3 rounded-xl border mb-4 transition-colors"
          style={{
            borderColor: consent ? "#22C55E" : "#DCFCE7",
            backgroundColor: consent ? "#F0FDF4" : "#FFFFFF",
          }}
          data-ocid="register.consent_checkbox"
        >
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
            style={{
              borderColor: consent ? "#22C55E" : "#D1D5DB",
              backgroundColor: consent ? "#22C55E" : "transparent",
            }}
          >
            {consent && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span
            className="text-sm leading-relaxed"
            style={{ color: "#111827" }}
          >
            I agree to the{" "}
            <Link
              to="/privacy-policy"
              className="underline"
              style={{ color: "#22C55E" }}
              onClick={(e) => e.stopPropagation()}
              data-ocid="register.privacy_policy_link"
            >
              Privacy Policy
            </Link>{" "}
            and consent to my data being processed by Develvyn Technologies Pvt
            Ltd
          </span>
        </button>

        {error && (
          <p
            className="text-xs text-center mb-3"
            style={{ color: "#EF4444" }}
            data-ocid="register.error_state"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !canSubmit}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-4 transition-colors"
          style={{
            backgroundColor: canSubmit && !loading ? "#22C55E" : "#D1D5DB",
          }}
          data-ocid="register.submit_button"
        >
          {loading ? "Submitting…" : "Register Apartment"}
        </button>

        <p className="text-sm text-center" style={{ color: "#6B7280" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium"
            style={{ color: "#22C55E" }}
            data-ocid="register.signin_link"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
