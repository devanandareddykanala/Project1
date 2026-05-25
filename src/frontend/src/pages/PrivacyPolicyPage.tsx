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
    title: "1. What data we collect",
    content: [
      "Full name — used for your profile within the app.",
      "Flat number — used for apartment management and communication.",
      "Device information — used for security and to provide the app experience.",
      "Internet Identity biometric — you log in using Internet Identity (fingerprint or Face ID). We do not collect or store your biometric data; it stays on your device.",
      "For watchmen: a government-issued photo ID, GPS location during shifts, and attendance records for salary calculation.",
    ],
  },
  {
    title: "2. Why we collect it",
    content: [
      "To identify you and manage your apartment or family account.",
      "To enable apartment-level features: maintenance payments, visitor logs, notices, and expenses.",
      "To verify the identity of security staff (watchmen).",
      "To calculate and record watchman attendance and shift hours.",
    ],
  },
  {
    title: "3. How long we store it",
    content: [
      "Your data is stored securely in our system for as long as your account is active.",
      "Financial and audit records (maintenance payments, wallet transactions) are stored permanently as required for legal accountability.",
      "After you delete your account, personal profile data is removed within 30 days. Audit logs are retained as required by law.",
    ],
  },
  {
    title: "4. Your rights",
    content: [
      "Access: You can view your data within the app at any time.",
      "Correction: You can update your name and contact details in Settings.",
      "Deletion: You can delete your account in Settings. This will remove your personal data.",
      "Withdrawal of consent: You can withdraw consent by deleting your account. This will not affect the lawfulness of processing before withdrawal.",
    ],
  },
  {
    title: "5. How to delete your account",
    content: [
      "Go to Settings (available in any mode).",
      'Tap "Delete My Account".',
      "Confirm the deletion. Your personal data will be removed within 30 days.",
      "Note: Financial audit records may be retained as required by applicable Indian law.",
    ],
  },
  {
    title: "6. Contact us",
    content: [
      "Data Protection Contact: support@develvyntechnologies.com",
      "Company: Develvyn Technologies Pvt Ltd",
      "For any data-related queries, grievances, or requests, please email us at the address above.",
    ],
  },
];

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" data-ocid="privacy_policy.page">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 border-b"
        style={{ backgroundColor: "#FFFFFF", borderColor: B.border }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-smooth hover:bg-green-50"
          style={{ color: B.text }}
          data-ocid="privacy_policy.back_button"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-base" style={{ color: B.text }}>
          Privacy Policy
        </h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 flex flex-col gap-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-xl font-bold" style={{ color: B.text }}>
            Privacy Policy
          </h2>
          <p className="text-sm mt-1" style={{ color: B.muted }}>
            Develvyn Technologies Pvt Ltd — Last updated: June 2025
          </p>
          <p
            className="text-sm mt-3 leading-relaxed"
            style={{ color: B.muted }}
          >
            This Privacy Policy explains how Develvyn Technologies Pvt Ltd
            collects, uses, and protects your personal data in accordance with
            the Digital Personal Data Protection (DPDP) Act 2023 of India.
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
          className="rounded-xl p-4 text-sm leading-relaxed"
          style={{
            backgroundColor: B.surface,
            borderColor: B.border,
            border: "1px solid",
          }}
        >
          <p className="font-medium mb-1" style={{ color: B.text }}>
            Grievance Officer / Data Protection Contact
          </p>
          <p style={{ color: B.muted }}>Develvyn Technologies Pvt Ltd</p>
          <a
            href="mailto:support@develvyntechnologies.com"
            className="underline"
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
