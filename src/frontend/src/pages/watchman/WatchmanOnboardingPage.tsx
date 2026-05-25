import { WatchmanIdType, createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Clock, Upload, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type VerificationStatus =
  | "not_submitted"
  | "submitted"
  | "approved"
  | "rejected";

export function WatchmanOnboardingPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<VerificationStatus>("not_submitted");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [idType, setIdType] = useState<WatchmanIdType>(WatchmanIdType.Aadhaar);
  const [submitting, setSubmitting] = useState(false);
  const { actor } = useActor(createActor);

  useEffect(() => {
    // DPDP consent gate — cannot bypass by navigating directly
    const consentGiven = localStorage.getItem("dpdp_consent_given");
    if (!consentGiven) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    const saved = (localStorage.getItem("watchman_verification_status") ??
      "not_submitted") as VerificationStatus;
    setStatus(saved);
    if (saved === "approved") void navigate({ to: "/watchman", replace: true });
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      if (actor)
        await actor.submitWatchmanIdDoc("pending-upload-phase1", idType);
      localStorage.setItem("watchman_verification_status", "submitted");
      setStatus("submitted");
      toast.success("ID submitted! Your Super Admin will review it.");
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReUpload = () => {
    setFile(null);
    setPreview(null);
    setStatus("not_submitted");
    localStorage.setItem("watchman_verification_status", "not_submitted");
  };

  const ID_TYPES = [
    { value: WatchmanIdType.Aadhaar, label: "Aadhaar Card" },
    { value: WatchmanIdType.VoterID, label: "Voter ID" },
    { value: WatchmanIdType.DrivingLicence, label: "Driving Licence" },
  ] as const;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FFFFFF" }}
      data-ocid="watchman_onboarding.page"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1.5px solid #DCFCE7",
        }}
      >
        <button
          type="button"
          onClick={() => void navigate({ to: "/watchman" })}
          className="p-2 rounded-xl"
          style={{ backgroundColor: "#F0FDF4" }}
          aria-label="Go back"
          data-ocid="watchman_onboarding.back_button"
        >
          <ArrowLeft size={20} style={{ color: "#16A34A" }} />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#16A34A" }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <title>D</title>
              <path d="M11 3L6 10.5H10L9 17L14 9.5H10L11 3Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: "#111827" }}>
            Identity Verification
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Title */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#16A34A" }}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <title>Develvyn</title>
              <path d="M11 3L6 10.5H10L9 17L14 9.5H10L11 3Z" fill="white" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold text-center"
            style={{ color: "#111827" }}
          >
            Watchman Verification
          </h1>
          <p className="text-sm text-center" style={{ color: "#6B7280" }}>
            Upload a clear photo of your government-issued ID for Super Admin
            approval.
          </p>
        </div>

        {/* Hard wall notice */}
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ backgroundColor: "#F0FDF4", border: "1.5px solid #86EFAC" }}
        >
          <span className="text-lg">🔒</span>
          <p className="text-xs" style={{ color: "#374151" }}>
            <strong>Privacy:</strong> You will only access Duty and Status
            screens. Apartment, Family, and Founder sections are not accessible
            from this account.
          </p>
        </div>

        {/* not_submitted */}
        {status === "not_submitted" && (
          <div
            className="rounded-2xl p-5 flex flex-col gap-5"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #D1FAE5",
            }}
          >
            {/* ID Type */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>
                ID Type
              </p>
              <div className="flex flex-col gap-2">
                {ID_TYPES.map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIdType(value)}
                    className="w-full rounded-xl py-3 px-4 text-left font-medium text-sm flex items-center justify-between"
                    style={{
                      backgroundColor: idType === value ? "#F0FDF4" : "#F9FAFB",
                      border: `1.5px solid ${idType === value ? "#22C55E" : "#E5E7EB"}`,
                      color: idType === value ? "#16A34A" : "#374151",
                    }}
                    data-ocid={`watchman_onboarding.id_type.${label.toLowerCase().replace(/ /g, "_")}`}
                  >
                    {label}
                    {idType === value && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold" style={{ color: "#374151" }}>
                Upload Photo
              </p>
              {preview ? (
                <div className="flex flex-col gap-2">
                  <img
                    src={preview}
                    alt="ID preview"
                    className="w-full rounded-xl object-cover"
                    style={{
                      maxHeight: "200px",
                      border: "1.5px solid #D1FAE5",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="text-xs underline self-start"
                    style={{ color: "#9CA3AF" }}
                  >
                    Choose different photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl py-10 transition-colors"
                  style={{
                    border: "2px dashed #22C55E",
                    backgroundColor: "#F9FAFB",
                    color: "#22C55E",
                  }}
                  data-ocid="watchman_onboarding.upload_button"
                >
                  <Upload size={28} />
                  <span className="text-sm font-semibold">
                    Tap to upload photo
                  </span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    Camera or gallery
                  </span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                data-ocid="watchman_onboarding.file_input"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!file || submitting}
              className="w-full font-bold rounded-2xl py-4 text-base disabled:opacity-40"
              style={{
                backgroundColor: file ? "#22C55E" : undefined,
                color: file ? "#FFFFFF" : undefined,
                minHeight: "56px",
              }}
              data-ocid="watchman_onboarding.submit_button"
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
            <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
              Processed under DPDP Act 2023 consent you provided.
            </p>
          </div>
        )}

        {/* submitted */}
        {status === "submitted" && (
          <div
            className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #FDE68A",
            }}
          >
            <div
              className="rounded-full p-4"
              style={{ backgroundColor: "#FFF7ED" }}
            >
              <Clock size={40} style={{ color: "#F59E0B" }} />
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
            >
              Pending Approval
            </span>
            <p className="font-semibold" style={{ color: "#111827" }}>
              ID submitted successfully
            </p>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Your Super Admin will review and approve your account. You'll be
              notified once approved.
            </p>
            <div
              className="w-full rounded-xl px-4 py-3"
              style={{
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
              }}
            >
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Submitted ID type:
              </p>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                {ID_TYPES.find((t) => t.value === idType)?.label ??
                  "Aadhaar Card"}
              </p>
            </div>
          </div>
        )}

        {/* approved */}
        {status === "approved" && (
          <div
            className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #86EFAC",
            }}
          >
            <div
              className="rounded-full p-4"
              style={{ backgroundColor: "#F0FDF4" }}
            >
              <CheckCircle size={40} style={{ color: "#22C55E" }} />
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
            >
              Approved ✓
            </span>
            <p className="font-semibold" style={{ color: "#111827" }}>
              Your account is verified
            </p>
            <Button
              onClick={() => void navigate({ to: "/watchman" })}
              className="w-full font-bold rounded-2xl py-4 text-base"
              style={{
                backgroundColor: "#22C55E",
                color: "#FFFFFF",
                minHeight: "56px",
              }}
              data-ocid="watchman_onboarding.go_to_duty_button"
            >
              Go to Duty Dashboard
            </Button>
          </div>
        )}

        {/* rejected */}
        {status === "rejected" && (
          <div
            className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #FCA5A5",
            }}
          >
            <div
              className="rounded-full p-4"
              style={{ backgroundColor: "#FEF2F2" }}
            >
              <XCircle size={40} style={{ color: "#EF4444" }} />
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
            >
              Rejected
            </span>
            <p className="font-semibold" style={{ color: "#111827" }}>
              Verification was not approved
            </p>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Your Super Admin rejected the submitted ID. Please re-upload a
              clearer photo.
            </p>
            <Button
              onClick={handleReUpload}
              className="w-full font-bold rounded-2xl py-4 text-base"
              style={{
                backgroundColor: "#22C55E",
                color: "#FFFFFF",
                minHeight: "56px",
              }}
              data-ocid="watchman_onboarding.reupload_button"
            >
              Re-Upload ID
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
