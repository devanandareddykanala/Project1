import { Layout } from "@/components/Layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/auth";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  RefreshCcw,
  Shield,
  ShieldAlert,
  Trash2,
  UserX,
} from "lucide-react";
import { useState } from "react";

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  ocid: string;
  variant?: "default" | "amber" | "red";
}

function SettingsRow({
  icon,
  label,
  onClick,
  ocid,
  variant = "default",
}: SettingsRowProps) {
  const isAmber = variant === "amber";
  const isRed = variant === "red";
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={ocid}
      className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#DCFCE7] last:border-b-0 transition-colors ${
        isRed
          ? "hover:bg-red-50"
          : isAmber
            ? "hover:bg-amber-50"
            : "hover:bg-[#F0FDF4]"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isRed ? "bg-red-50" : isAmber ? "bg-amber-50" : "bg-[#F0FDF4]"
        }`}
      >
        {icon}
      </div>
      <span
        className={`flex-1 text-sm font-medium text-left ${
          isRed ? "text-red-500" : isAmber ? "text-amber-600" : "text-[#111827]"
        }`}
      >
        {label}
      </span>
      <ChevronRight
        size={16}
        className={
          isRed ? "text-red-200" : isAmber ? "text-amber-200" : "text-[#DCFCE7]"
        }
      />
    </button>
  );
}

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-[#6b7280] flex-shrink-0">{label}</span>
      {children ?? (
        <span className="text-sm font-medium text-[#111827] text-right">
          {value}
        </span>
      )}
    </div>
  );
}

export function FamilyMore() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [showConsentRecord, setShowConsentRecord] = useState(false);
  const [showGrievance, setShowGrievance] = useState(false);

  return (
    <Layout>
      <div className="min-h-screen bg-white pb-24" data-ocid="family_more.page">
        <div className="px-4 pt-6 pb-4">
          <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">
            Family Mode
          </p>
          <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
        </div>

        {/* Profile */}
        {user?.name && (
          <div className="mx-4 mb-5 bg-white rounded-xl border border-[#DCFCE7] p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#111827] truncate">
                {user.name}
              </p>
              <p className="text-xs text-[#6b7280]">Family Member</p>
            </div>
          </div>
        )}

        {/* Legal & Privacy */}
        <div className="px-4 mb-5">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
            Legal & Privacy
          </p>
          <div className="bg-white rounded-xl border border-[#DCFCE7] shadow-sm overflow-hidden">
            <SettingsRow
              icon={<ShieldAlert size={16} className="text-[#22C55E]" />}
              label="Privacy Policy"
              onClick={() => navigate({ to: "/privacy-policy" })}
              ocid="family_more.privacy_policy_link"
            />
            <SettingsRow
              icon={<FileText size={16} className="text-[#22C55E]" />}
              label="Terms & Conditions"
              onClick={() => navigate({ to: "/terms-and-conditions" })}
              ocid="family_more.terms_link"
            />
            <SettingsRow
              icon={<RefreshCcw size={16} className="text-[#22C55E]" />}
              label="Cancel & Refund Policy"
              onClick={() => navigate({ to: "/cancel-refund-policy" })}
              ocid="family_more.refund_policy_link"
            />
            <SettingsRow
              icon={<Shield size={16} className="text-[#22C55E]" />}
              label="DPDP Consent Record"
              onClick={() => setShowConsentRecord(true)}
              ocid="family_more.consent_record_button"
            />
            <SettingsRow
              icon={<Info size={16} className="text-[#22C55E]" />}
              label="Grievance Officer"
              onClick={() => setShowGrievance(true)}
              ocid="family_more.grievance_officer_button"
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  data-ocid="family_more.legal_withdraw_consent_button"
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-amber-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <UserX size={16} className="text-amber-600" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-amber-600 text-left">
                    Withdraw Consent
                  </span>
                  <ChevronRight size={16} className="text-amber-200" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="family_more.legal_withdraw_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Withdraw Data Consent?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Under the DPDP Act 2023, you may withdraw consent at any
                    time. This will begin the account deletion process and
                    remove your data from Develvyn. Contact{" "}
                    <a
                      href="mailto:support@develvyntechnologies.com"
                      className="text-[#22C55E] underline"
                    >
                      support@develvyntechnologies.com
                    </a>{" "}
                    if you need help.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="family_more.legal_withdraw_cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => logout()}
                    data-ocid="family_more.legal_withdraw_confirm_button"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Withdraw & Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Support */}
        <div className="px-4 mb-5">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
            Support
          </p>
          <div className="bg-white rounded-xl border border-[#DCFCE7] shadow-sm overflow-hidden">
            <SettingsRow
              icon={<HelpCircle size={16} className="text-[#22C55E]" />}
              label="Raise a Support Ticket"
              onClick={() => navigate({ to: "/founder/tickets" })}
              ocid="family_more.support_ticket_button"
            />
          </div>
        </div>

        {/* Account */}
        <div className="px-4 mb-5">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
            Account
          </p>
          <div className="bg-white rounded-xl border border-[#DCFCE7] shadow-sm overflow-hidden">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  data-ocid="family_more.withdraw_consent_button"
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#DCFCE7] hover:bg-amber-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <UserX size={16} className="text-amber-600" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-amber-600 text-left">
                    Withdraw Consent
                  </span>
                  <ChevronRight size={16} className="text-amber-200" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="family_more.withdraw_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Withdraw Data Consent?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Under the DPDP Act 2023, you may withdraw consent at any
                    time. This will begin the account deletion process and
                    remove your data from Develvyn. Contact{" "}
                    <a
                      href="mailto:support@develvyntechnologies.com"
                      className="text-[#22C55E] underline"
                    >
                      support@develvyntechnologies.com
                    </a>{" "}
                    if you need help.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="family_more.withdraw_cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => logout()}
                    data-ocid="family_more.withdraw_confirm_button"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Withdraw & Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  data-ocid="family_more.delete_account_button"
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={16} className="text-red-500" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-red-500 text-left">
                    Delete Account
                  </span>
                  <ChevronRight size={16} className="text-red-200" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="family_more.delete_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your family profile and all
                    associated data. This action cannot be undone. To exercise
                    your rights under the DPDP Act 2023, contact{" "}
                    <a
                      href="mailto:support@develvyntechnologies.com"
                      className="text-[#22C55E] underline"
                    >
                      support@develvyntechnologies.com
                    </a>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="family_more.delete_cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => logout()}
                    data-ocid="family_more.delete_confirm_button"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Consent Record Bottom Sheet */}
        {showConsentRecord && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setShowConsentRecord(false)}
              aria-label="Close"
            />
            <div
              className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl p-6"
              data-ocid="family_more.consent_record_dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#111827] text-lg">
                  DPDP Consent Record
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConsentRecord(false)}
                  data-ocid="family_more.consent_record_close_button"
                  className="text-[#6b7280] hover:text-[#111827] text-lg leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-[#F0FDF4] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#111827] mb-2">
                    What you consented to:
                  </p>
                  <ul className="text-xs text-[#6b7280] space-y-1 list-disc list-inside">
                    <li>
                      Collection and processing of your identity via Internet
                      Identity (biometric)
                    </li>
                    <li>
                      Storage of family tasks, expenses, grocery lists, and
                      calendar events
                    </li>
                    <li>
                      Read-only sharing of maintenance status with your
                      apartment account
                    </li>
                  </ul>
                </div>
                <div className="bg-white border border-[#DCFCE7] rounded-xl p-4 space-y-2">
                  <InfoRow
                    label="Consented on"
                    value={new Date().toLocaleDateString("en-IN")}
                  />
                  <InfoRow label="Governing law" value="DPDP Act 2023, India" />
                  <InfoRow
                    label="Data retained for"
                    value="Duration of account"
                  />
                  <InfoRow label="Contact">
                    <a
                      href="mailto:support@develvyntechnologies.com"
                      className="text-[#22C55E] underline text-sm"
                    >
                      support@develvyntechnologies.com
                    </a>
                  </InfoRow>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grievance Officer Bottom Sheet */}
        {showGrievance && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setShowGrievance(false)}
              aria-label="Close"
            />
            <div
              className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl p-6"
              data-ocid="family_more.grievance_dialog"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#111827] text-lg">
                  Grievance Officer
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGrievance(false)}
                  data-ocid="family_more.grievance_close_button"
                  className="text-[#6b7280] hover:text-[#111827] text-lg leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#6b7280] bg-[#F0FDF4] rounded-xl p-3">
                  Under the DPDP Act 2023, you have the right to raise a
                  grievance with our appointed officer. All complaints are
                  acknowledged within 48 hours.
                </p>
                <div className="bg-white border border-[#DCFCE7] rounded-xl p-4 space-y-2">
                  <InfoRow label="Name" value="Data Privacy Officer" />
                  <InfoRow label="Designation" value="Grievance Officer" />
                  <InfoRow
                    label="Company"
                    value="Develvyn Technologies Pvt Ltd"
                  />
                  <InfoRow label="Email">
                    <a
                      href="mailto:support@develvyntechnologies.com"
                      className="text-[#22C55E] underline text-sm"
                    >
                      support@develvyntechnologies.com
                    </a>
                  </InfoRow>
                  <InfoRow label="Response time" value="Within 48 hours" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-6 flex flex-col items-center gap-1">
          <p className="text-xs text-[#6b7280]">
            Develvyn Technologies Pvt Ltd
          </p>
          <a
            href="mailto:support@develvyntechnologies.com"
            className="text-xs text-[#22C55E] underline"
          >
            support@develvyntechnologies.com
          </a>
          <p className="text-xs text-[#6b7280] mt-1">
            © {new Date().getFullYear()} · Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#22C55E]"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
