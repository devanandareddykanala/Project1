import { createActor } from "@/backend";
import type { AppFeedback, FeedbackRecord } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

type InAppFilter = "All" | "Suggestion" | "Bug" | "Compliment";

const IN_APP_FILTERS: InAppFilter[] = [
  "All",
  "Suggestion",
  "Bug",
  "Compliment",
];

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function inAppBadge(type: string): string {
  const map: Record<string, string> = {
    Suggestion: "bg-orange-100 text-orange-700",
    Bug: "bg-red-100 text-red-700",
    Compliment: "bg-green-100 text-green-700",
  };
  return map[type] ?? "bg-gray-100 text-gray-600";
}

type FeedbackStatus = "Noted" | "In Progress" | "Implemented" | "Won't Do" | "";

const STATUS_OPTIONS: FeedbackStatus[] = [
  "Noted",
  "In Progress",
  "Implemented",
  "Won't Do",
];

function statusStyle(s: FeedbackStatus): string {
  const map: Record<string, string> = {
    Noted: "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-700",
    Implemented: "bg-green-100 text-green-700",
    "Won't Do": "bg-red-100 text-red-600",
  };
  return map[s] ?? "bg-gray-50 text-gray-400";
}

export function FounderFeedback() {
  const { actor, isFetching } = useActor(createActor);
  const [inAppFeedback, setInAppFeedback] = useState<FeedbackRecord[]>([]);
  const [supportFeedback, setSupportFeedback] = useState<AppFeedback[]>([]);
  const [tab, setTab] = useState<"inapp" | "support">("inapp");
  const [inAppFilter, setInAppFilter] = useState<InAppFilter>("All");
  const [loading, setLoading] = useState(true);
  const [feedbackStatus, setFeedbackStatus] = useState<
    Map<string, FeedbackStatus>
  >(new Map());

  const setStatus = (id: string, status: FeedbackStatus) => {
    setFeedbackStatus((prev) => new Map(prev).set(id, status));
  };

  useEffect(() => {
    if (!actor || isFetching) return;
    Promise.all([
      actor.getInAppFeedback(null).catch(() => [] as FeedbackRecord[]),
      actor.getFeedback().catch(() => [] as AppFeedback[]),
    ])
      .then(([inApp, support]) => {
        setInAppFeedback(inApp);
        setSupportFeedback(support);
      })
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const filteredInApp = inAppFeedback.filter((f) => {
    if (inAppFilter === "All") return true;
    return f.feedbackType === inAppFilter;
  });

  return (
    <Layout>
      <div
        className="flex flex-col gap-4 px-4 py-5 bg-white min-h-screen"
        data-ocid="founder_feedback.page"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Feedback</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {inAppFeedback.length + supportFeedback.length} total responses
          </p>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2" data-ocid="founder_feedback.tabs">
          <button
            type="button"
            onClick={() => setTab("inapp")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === "inapp"
                ? "bg-[#22C55E] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            data-ocid="founder_feedback.tab.inapp"
          >
            In-App
          </button>
          <button
            type="button"
            onClick={() => setTab("support")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === "support"
                ? "bg-[#22C55E] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            data-ocid="founder_feedback.tab.support"
          >
            Support
          </button>
        </div>

        {/* In-App tab */}
        {tab === "inapp" && (
          <div className="flex flex-col gap-4">
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              data-ocid="founder_feedback.inapp_filters"
            >
              {IN_APP_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setInAppFilter(f)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    inAppFilter === f
                      ? "bg-[#22C55E] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  data-ocid={`founder_feedback.filter.${f.toLowerCase()}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredInApp.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-12"
                data-ocid="founder_feedback.inapp_empty_state"
              >
                <div className="bg-[#F0FDF4] rounded-full p-4">
                  <MessageSquare size={28} className="text-[#22C55E]" />
                </div>
                <p className="text-gray-500 text-sm">No feedback yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredInApp.map((f, i) => {
                  const currentStatus = feedbackStatus.get(f.id) ?? "";
                  return (
                    <div
                      key={f.id}
                      className="bg-white border border-[#DCFCE7] rounded-2xl p-4 flex flex-col gap-3"
                      data-ocid={`founder_feedback.inapp.item.${i + 1}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${inAppBadge(f.feedbackType)}`}
                        >
                          {f.feedbackType}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(f.submittedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{f.message}</p>
                      {/* Status action buttons */}
                      <div
                        className="flex flex-wrap gap-1.5"
                        data-ocid={`founder_feedback.status_buttons.${i + 1}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setStatus(f.id, s === currentStatus ? "" : s)
                            }
                            className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                              currentStatus === s
                                ? `${statusStyle(s)} border-transparent`
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                            data-ocid={`founder_feedback.status.${s.toLowerCase().replace(/[' ]/g, "_")}.${i + 1}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      {currentStatus && (
                        <p
                          className={`text-xs font-medium px-2.5 py-1 rounded-full self-start ${statusStyle(currentStatus)}`}
                        >
                          Status: {currentStatus}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Support tab */}
        {tab === "support" && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : supportFeedback.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-12"
                data-ocid="founder_feedback.support_empty_state"
              >
                <div className="bg-[#F0FDF4] rounded-full p-4">
                  <MessageSquare size={28} className="text-[#22C55E]" />
                </div>
                <p className="text-gray-500 text-sm">No support feedback yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {supportFeedback.map((f, i) => (
                  <div
                    key={String(f.id)}
                    className="bg-white border border-[#DCFCE7] rounded-2xl p-4 flex flex-col gap-2"
                    data-ocid={`founder_feedback.support.item.${i + 1}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#22C55E]">
                        {f.moduleName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(f.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{f.comment}</p>
                    <p className="text-sm text-yellow-500">
                      {"★".repeat(Number(f.rating))}
                      {"☆".repeat(5 - Number(f.rating))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
