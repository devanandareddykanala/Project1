import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FeedbackType = "Suggestion" | "Bug" | "Compliment" | "Other";

export function FeedbackButton() {
  const { actor } = useActor(createActor);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("Suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const types: FeedbackType[] = ["Suggestion", "Bug", "Compliment", "Other"];

  const handleSubmit = async () => {
    if (!actor || !message.trim()) return;
    setSubmitting(true);
    try {
      await actor.submitInAppFeedback(type, message.trim(), null);
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setMessage("");
        setType("Suggestion");
      }, 2000);
    } catch {
      toast.error("Could not send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-ocid="feedback.open_modal_button"
        className="fixed z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 hover:bg-[#16A34A]"
        style={{
          bottom: 80,
          right: 16,
          backgroundColor: "#22C55E",
          color: "#FFFFFF",
        }}
        aria-label="Send feedback"
      >
        <MessageSquare size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          data-ocid="feedback.dialog"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl p-6 pb-safe">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#111827] text-lg">
                Share Feedback
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                data-ocid="feedback.close_button"
                className="text-[#6b7280] hover:text-[#111827] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {done ? (
              <div
                className="flex flex-col items-center py-6 gap-3"
                data-ocid="feedback.success_state"
              >
                <div className="w-14 h-14 rounded-full bg-[#DCFCE7] flex items-center justify-center">
                  <span className="text-2xl">🙏</span>
                </div>
                <p className="text-[#111827] font-medium">
                  Thank you for your feedback!
                </p>
                <p className="text-sm text-[#6b7280]">
                  We'll review it carefully.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      data-ocid={`feedback.type.${t.toLowerCase()}`}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        type === t
                          ? "bg-[#22C55E] text-white"
                          : "bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  rows={4}
                  data-ocid="feedback.textarea"
                  className="w-full rounded-xl border border-[#DCFCE7] bg-white p-3 text-sm text-[#111827] placeholder-[#6b7280] resize-none focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !message.trim()}
                  data-ocid="feedback.submit_button"
                  className="mt-4 w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors duration-200"
                >
                  {submitting ? "Sending..." : "Send Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
