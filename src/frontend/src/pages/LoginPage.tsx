import { DevelvynLogo } from "@/components/DevelvynLogo";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";

const _C = {
  accent: "#22C55E",
  deep: "#16A34A",
  text: "#111827",
  muted: "#6B7280",
  border: "#DCFCE7",
  surface: "#F8F9FA",
};

export function LoginPage() {
  const { loginWithII, isLoading } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center px-6"
      data-ocid="login.page"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Company logo */}
        <DevelvynLogo size={72} />

        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: "#111827" }}>
            Develvyn
          </h1>
          <p className="font-light mt-1" style={{ color: "#6B7280" }}>
            The Family Suite
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            by Develvyn Technologies Pvt Ltd
          </p>
        </div>

        {/* Internet Identity login button */}
        <button
          type="button"
          onClick={loginWithII}
          disabled={isLoading}
          className="w-full text-white font-semibold py-4 rounded-xl text-base transition-colors"
          style={{ backgroundColor: isLoading ? "#86EFAC" : "#22C55E" }}
          data-ocid="login.submit_button"
        >
          {isLoading ? "Connecting..." : "Login with Internet Identity"}
        </button>

        {/* Register link */}
        <button
          type="button"
          onClick={() => navigate({ to: "/register" })}
          className="text-sm font-medium"
          style={{ color: "#22C55E" }}
          data-ocid="login.register_link"
        >
          Register your apartment
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/join" })}
          className="text-xs"
          style={{ color: "#6B7280" }}
          data-ocid="login.invite_link"
        >
          Join with invite code
        </button>

        {/* Legal links */}
        <div className="flex gap-3 items-center mt-2">
          <Link
            to="/privacy-policy"
            className="text-xs underline"
            style={{ color: "#9CA3AF" }}
            data-ocid="login.privacy_policy_link"
          >
            Privacy Policy
          </Link>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <Link
            to="/terms-and-conditions"
            className="text-xs underline"
            style={{ color: "#9CA3AF" }}
            data-ocid="login.terms_link"
          >
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}
