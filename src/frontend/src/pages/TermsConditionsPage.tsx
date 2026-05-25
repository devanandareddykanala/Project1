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
    title: "1. Who can use this app",
    content: [
      "Develvyn is for residents and staff of registered apartments, housing societies, and their family members.",
      "Access is by invitation only. You must be invited by your apartment Super Admin, Flat Admin, or the Develvyn team.",
      "You must be at least 18 years old to register an account.",
    ],
  },
  {
    title: "2. Acceptable use",
    content: [
      "Use the app only for its intended purpose — managing your apartment or family household.",
      "Do not trigger a false SOS alert. This is a safety feature for real emergencies only.",
      "Do not misuse the visitor log or enter false visitor information.",
      "Do not attempt to access another user's data or another flat's records.",
      "Do not use the app for any illegal activity.",
    ],
  },
  {
    title: "3. Your responsibilities",
    content: [
      "Keep your Internet Identity credentials secure. Do not share access with others.",
      "All financial entries and audit records you create are permanent. Enter information accurately.",
      "Notify us immediately at support@develvyntechnologies.com if you suspect unauthorized access to your account.",
    ],
  },
  {
    title: "4. What Develvyn is responsible for",
    content: [
      "Develvyn provides a platform for apartment and household management. We are not responsible for disputes between residents.",
      "We do not verify the accuracy of maintenance payment amounts, visitor identities, or notices posted by users.",
      "Develvyn is not liable for any financial loss arising from incorrect data entered by users.",
      "We will make reasonable efforts to keep the platform available, but we do not guarantee 100% uptime.",
    ],
  },
  {
    title: "5. Account suspension",
    content: [
      "We may suspend your account if you violate these terms, particularly: false SOS alerts, fraud, or misuse of financial records.",
      "Your Super Admin can revoke your access at any time. Develvyn can suspend accounts at its discretion.",
      "Suspended accounts retain audit records but lose active access.",
    ],
  },
  {
    title: "6. Governing law",
    content: [
      "These Terms are governed by the laws of India.",
      "Any disputes will be subject to the exclusive jurisdiction of the courts in India.",
      "By using Develvyn, you agree to these terms and to Indian law as the governing framework.",
    ],
  },
  {
    title: "7. Changes to these terms",
    content: [
      "We may update these Terms from time to time. We will notify you in the app.",
      "Continued use of the app after changes means you accept the updated Terms.",
    ],
  },
  {
    title: "8. Contact",
    content: [
      "Develvyn Technologies Pvt Ltd",
      "For questions about these Terms: support@develvyntechnologies.com",
    ],
  },
];

export function TermsConditionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" data-ocid="terms.page">
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
          data-ocid="terms.back_button"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-base" style={{ color: B.text }}>
          Terms &amp; Conditions
        </h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 flex flex-col gap-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-xl font-bold" style={{ color: B.text }}>
            Terms &amp; Conditions
          </h2>
          <p className="text-sm mt-1" style={{ color: B.muted }}>
            Develvyn Technologies Pvt Ltd — Last updated: June 2025
          </p>
          <p
            className="text-sm mt-3 leading-relaxed"
            style={{ color: B.muted }}
          >
            Please read these Terms carefully before using Develvyn — The Family
            Suite. By creating an account and using this app, you agree to be
            bound by these Terms.
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
            Questions about these Terms?
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
