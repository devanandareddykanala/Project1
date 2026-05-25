import { createActor } from "@/backend";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  HelpCircle,
  Mail,
  Shield,
  User,
  UserX,
} from "lucide-react";
import { useState } from "react";

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-5 mb-2 px-1">
      {title}
    </p>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  desc,
  onClick,
  ocid,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  desc?: string;
  onClick?: () => void;
  ocid: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 text-left hover:border-[#22C55E] transition-colors"
      data-ocid={ocid}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          danger ? "bg-red-50" : "bg-white border border-gray-100"
        }`}
      >
        <Icon
          size={18}
          className={danger ? "text-red-500" : "text-[#22C55E]"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            danger ? "text-red-600" : "text-gray-900"
          }`}
        >
          {label}
        </p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

export function ApartmentMore() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showWithdrawWarning, setShowWithdrawWarning] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { actor } = useActor(createActor);
  const [showGrievance, setShowGrievance] = useState(false);
  const [showConsentRecord, setShowConsentRecord] = useState(false);

  return (
    <Layout>
      <div
        className="p-4 bg-white min-h-screen pb-24"
        data-ocid="apartment_settings.page"
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-2">
          Account and legal preferences
        </p>

        {/* Profile */}
        <SectionHeader title="Profile" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">
              {(user?.name ?? "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name ?? "User"}
            </p>
            {user?.flatId !== undefined && (
              <p className="text-xs text-gray-500">
                Flat #{user.flatId.toString()}
              </p>
            )}
          </div>
        </div>

        {/* Legal & Privacy */}
        <SectionHeader title="Legal & Privacy" />
        <div className="flex flex-col gap-2">
          <SettingsRow
            icon={Shield}
            label="Privacy Policy"
            desc="How your data is collected and used"
            onClick={() => navigate({ to: "/privacy-policy" })}
            ocid="settings.privacy_policy_link"
          />
          <SettingsRow
            icon={FileText}
            label="Terms & Conditions"
            desc="Rules and guidelines for using Develvyn"
            onClick={() => navigate({ to: "/terms-and-conditions" })}
            ocid="settings.terms_link"
          />
          <SettingsRow
            icon={FileText}
            label="Cancel & Refund Policy"
            desc="Subscription cancellation and refund rules"
            onClick={() => navigate({ to: "/cancel-refund-policy" })}
            ocid="settings.refund_policy_link"
          />
          <SettingsRow
            icon={User}
            label="DPDP Consent Record"
            desc="View what you consented to and when"
            onClick={() => setShowConsentRecord(true)}
            ocid="settings.consent_record_button"
          />
          <SettingsRow
            icon={HelpCircle}
            label="Grievance Officer"
            desc="Contact for data and privacy concerns"
            onClick={() => setShowGrievance(true)}
            ocid="settings.grievance_button"
          />
          <SettingsRow
            icon={UserX}
            label="Withdraw Consent"
            desc="Delete your account and all associated data"
            onClick={() => setShowWithdrawWarning(true)}
            ocid="settings.withdraw_consent_button"
            danger
          />
        </div>

        {/* Support */}
        <SectionHeader title="Support" />
        <div className="flex flex-col gap-2">
          <SettingsRow
            icon={HelpCircle}
            label="Raise a Support Ticket"
            desc="Report issues or get help from Develvyn team"
            onClick={() => navigate({ to: "/founder/tickets" })}
            ocid="settings.support_ticket_link"
          />
        </div>

        {/* Grievance Officer Modal */}
        {showGrievance && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            data-ocid="settings.grievance_dialog"
          >
            <div className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Grievance Officer
                </h2>
                <button
                  type="button"
                  onClick={() => setShowGrievance(false)}
                  className="text-gray-400 text-xl leading-none"
                  data-ocid="settings.grievance_close_button"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      Founder, Develvyn
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Designation</p>
                    <p className="text-sm font-semibold text-gray-900">
                      Grievance Officer
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="text-sm font-semibold text-gray-900">
                      Develvyn Technologies Pvt Ltd
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a
                      href="mailto:support@develvyntechnologies.com"
                      className="text-sm font-semibold text-[#22C55E]"
                    >
                      support@develvyntechnologies.com
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Response Time</p>
                    <p className="text-sm font-semibold text-gray-900">
                      Within 48 hours of complaint
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  You may raise data or privacy concerns by emailing the officer
                  above. All complaints are addressed within 48 hours as per
                  DPDP Act 2023.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Consent Record Modal */}
        {showConsentRecord && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            data-ocid="settings.consent_record_dialog"
          >
            <div className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  DPDP Consent Record
                </h2>
                <button
                  type="button"
                  onClick={() => setShowConsentRecord(false)}
                  className="text-gray-400 text-xl leading-none"
                  data-ocid="settings.consent_record_close_button"
                >
                  ×
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <p className="text-xs text-gray-500">Date of Consent</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Recorded at registration
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">What You Agreed To</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {[
                      "Collection of name and flat details",
                      "Usage for apartment management only",
                      "Sharing with building Super Admin only",
                      "Retention until account deletion",
                    ].map((item) => (
                      <li
                        key={item}
                        className="text-xs text-gray-700 flex items-start gap-1.5"
                      >
                        <span className="text-[#22C55E] mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Device</p>
                  <p className="text-sm text-gray-700">
                    {navigator.userAgent.split(" ").slice(0, 3).join(" ")}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                To withdraw consent, use the "Withdraw Consent" option in
                settings. This will permanently delete your account.
              </p>
            </div>
          </div>
        )}

        {/* Withdraw Consent Warning Modal */}
        {showWithdrawWarning && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            data-ocid="settings.withdraw_consent_dialog"
          >
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Withdraw Consent & Delete Account
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  This will permanently delete your account and all associated
                  data. This action cannot be undone.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  For help, contact: support@develvyntechnologies.com
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {deleteError && (
                  <p className="text-xs text-red-500 text-center -mb-1">
                    {deleteError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={async () => {
                    setDeleteError(null);
                    setDeleteLoading(true);
                    try {
                      if (
                        actor &&
                        typeof (actor as unknown as Record<string, unknown>)
                          .deleteAccount === "function"
                      ) {
                        await (
                          actor as unknown as {
                            deleteAccount: () => Promise<unknown>;
                          }
                        ).deleteAccount();
                      }
                      // TODO: Wire actor.deleteAccount() when backend method is ready
                      setShowWithdrawWarning(false);
                      navigate({ to: "/login" });
                    } catch {
                      setDeleteError(
                        "Something went wrong. Please contact support@develvyntechnologies.com",
                      );
                    } finally {
                      setDeleteLoading(false);
                    }
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  data-ocid="settings.withdraw_confirm_button"
                >
                  {deleteLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    "Yes, Delete My Account"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawWarning(false)}
                  className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors hover:border-gray-300"
                  data-ocid="settings.withdraw_cancel_button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ApartmentMore;
