import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const B = {
  text: "#111827",
  muted: "#6B7280",
  border: "#DCFCE7",
  surface: "#F8F9FA",
  accent: "#22C55E",
};

const SECTIONS = [
  {
    title: "1. Free trial",
    content: [
      "New apartments get a 7-day free trial. No payment is required to start.",
      "You can cancel at any time during the trial with no charge.",
    ],
  },
  {
    title: "2. Monthly subscription",
    content: [
      "After the trial, Develvyn is available on a monthly subscription basis.",
      "You can cancel your subscription at any time from Settings → Subscription → Cancel.",
      "Cancellation takes effect at the end of the current billing month. There are no refunds for the current month.",
      "After cancellation, your data is retained for 30 days. You can reactivate within this window.",
    ],
  },
  {
    title: "3. Annual subscription (coming soon)",
    content: [
      "Annual plans will be available in a future update.",
      "For annual plans: if you cancel within 30 days of payment, you will receive a pro-rata refund for unused months.",
      "After 30 days, no refunds will be issued for annual subscriptions.",
    ],
  },
  {
    title: "4. How to cancel",
    content: [
      "Go to Settings (tap your avatar in the top-right corner).",
      "Tap Subscription.",
      "Tap Cancel Subscription and confirm.",
      "You will receive a confirmation in the app.",
    ],
  },
  {
    title: "5. Refund process",
    content: [
      "Approved refunds are processed to the original payment method.",
      "Refunds typically take 5–7 working days to appear in your account.",
      "If you do not receive a refund within 10 working days, contact us.",
    ],
  },
  {
    title: "6. No refunds for the following",
    content: [
      "Partial months used — we do not refund for days used within a billing period.",
      "Accounts suspended for violations of our Terms & Conditions.",
      "Data export fees (if applicable in future).",
    ],
  },
  {
    title: "7. Contact for billing disputes",
    content: [
      "For any billing questions, disputes, or refund requests: support@develvyntechnologies.com",
      "Please include your apartment name, registered email, and transaction reference in your message.",
      "We aim to respond within 48 hours.",
    ],
  },
];

export function CancelRefundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" data-ocid="cancel_refund.page">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 border-b"
        style={{ backgroundColor: "#FFFFFF", borderColor: B.border }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: -1 as unknown as string })}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-green-50"
          style={{ color: B.text }}
          data-ocid="cancel_refund.back_button"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-base" style={{ color: B.text }}>
          Cancel &amp; Refund Policy
        </h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 flex flex-col gap-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-xl font-bold" style={{ color: B.text }}>
            Cancel &amp; Refund Policy
          </h2>
          <p className="text-sm mt-1" style={{ color: B.muted }}>
            Develvyn Technologies Pvt Ltd — Last updated: June 2025
          </p>
          <p
            className="text-sm mt-3 leading-relaxed"
            style={{ color: B.muted }}
          >
            We want to be clear and fair about how cancellations and refunds
            work. No surprises.
          </p>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h3 className="font-semibold text-base" style={{ color: B.text }}>
              {section.title}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {section.content.map((item) => (
                <li key={item} className="flex gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: B.accent }}
                  />
                  <span
                    className="text-sm leading-relaxed"
                    style={{ color: B.muted }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div
          className="rounded-xl p-4 text-sm"
          style={{
            backgroundColor: B.surface,
            border: `1px solid ${B.border}`,
          }}
        >
          <p className="font-medium mb-1" style={{ color: B.text }}>
            Need help with billing or cancellation?
          </p>
          <a
            href="mailto:support@develvyntechnologies.com"
            className="underline text-sm"
            style={{ color: B.accent }}
          >
            support@develvyntechnologies.com
          </a>
        </div>

        <p className="text-xs text-center pb-4" style={{ color: B.muted }}>
          © {new Date().getFullYear()} Develvyn Technologies Pvt Ltd. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
