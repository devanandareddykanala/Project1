import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { Navigate } from "@tanstack/react-router";
import { Filter, Shield, Star } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FeedbackModule =
  | "Maintenance"
  | "Visitor Log"
  | "Notice Board"
  | "Family Expenses"
  | "Watchman Mode"
  | "Grocery List"
  | "SOS Module"
  | "Overall";

interface FeedbackItem {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  module: FeedbackModule;
  submittedAt: number;
}

const ALL_MODULES: FeedbackModule[] = [
  "Overall",
  "Maintenance",
  "Visitor Log",
  "Notice Board",
  "Family Expenses",
  "Watchman Mode",
  "Grocery List",
  "SOS Module",
];

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          style={{
            color: s <= rating ? "oklch(0.80 0.19 65)" : "oklch(0.30 0.05 265)",
            fill: s <= rating ? "oklch(0.80 0.19 65)" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

function formatRelativeTime(ms: number) {
  const diff = Date.now() - ms;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-2 text-xs border"
      style={{
        backgroundColor: "oklch(0.20 0.06 265)",
        borderColor: "oklch(0.28 0.05 265)",
        color: "oklch(0.88 0.04 265)",
      }}
    >
      {label}★: {payload[0].value} reviews
    </div>
  );
}

export function AppFeedback() {
  const user = useAuthStore((s) => s.user);
  const [feedbackItems, _setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [moduleFilter, setModuleFilter] = useState<FeedbackModule | "all">(
    "all",
  );
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");

  const filtered = useMemo(() => {
    if (user?.role === "employee") return [];
    return feedbackItems
      .filter((f) => {
        const matchModule = moduleFilter === "all" || f.module === moduleFilter;
        const matchRating = ratingFilter === "all" || f.rating === ratingFilter;
        return matchModule && matchRating;
      })
      .sort((a, b) => {
        if (sortBy === "date") return b.submittedAt - a.submittedAt;
        return b.rating - a.rating;
      });
  }, [user?.role, feedbackItems, moduleFilter, ratingFilter, sortBy]);

  // Guard: Employees can only see tickets
  if (user?.role === "employee") {
    return <Navigate to="/founder/tickets" />;
  }

  const avgRating =
    feedbackItems.length > 0
      ? feedbackItems.reduce((sum, f) => sum + f.rating, 0) /
        feedbackItems.length
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: feedbackItems.filter((f) => f.rating === r).length,
  }));

  return (
    <Layout>
      <div
        className="flex flex-col gap-5 p-4 pb-6"
        data-ocid="founder_feedback.page"
      >
        {/* Header */}
        <div className="pt-2">
          <p
            className="text-xs uppercase tracking-widest font-body mb-1"
            style={{ color: "oklch(0.72 0.19 65)" }}
          >
            Founder Portal
          </p>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: "oklch(0.92 0.04 65)" }}
          >
            App Feedback
          </h1>
          <p
            className="text-sm mt-0.5 font-body"
            style={{ color: "oklch(0.55 0.05 265)" }}
          >
            {feedbackItems.length > 0
              ? `${feedbackItems.length} reviews · Anonymized`
              : "No feedback received yet"}
          </p>
        </div>

        {/* Average rating hero */}
        <div
          className="rounded-2xl p-5 flex items-center gap-5 border"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.08 65 / 0.3), oklch(0.18 0.05 265))",
            borderColor: "oklch(0.72 0.19 65 / 0.3)",
          }}
          data-ocid="founder_feedback.avg_rating"
        >
          <div className="flex flex-col items-center">
            <p
              className="font-display text-5xl font-bold leading-none"
              style={{ color: "oklch(0.85 0.19 65)" }}
            >
              {avgRating.toFixed(1)}
            </p>
            <StarDisplay rating={Math.round(avgRating)} size={16} />
            <p
              className="text-xs mt-1 font-body"
              style={{ color: "oklch(0.55 0.05 265)" }}
            >
              out of 5
            </p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart
                data={distribution}
                layout="vertical"
                margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                barCategoryGap="15%"
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="star"
                  type="category"
                  tick={{ fill: "oklch(0.55 0.05 265)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}★`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {distribution.map((entry) => (
                    <Cell
                      key={`star-${entry.star}`}
                      fill={
                        entry.star >= 4
                          ? "oklch(0.72 0.19 65)"
                          : entry.star === 3
                            ? "oklch(0.60 0.12 65)"
                            : "oklch(0.55 0.12 22)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters + sort row */}
        <div className="flex flex-col gap-2">
          {/* Sort toggle */}
          <div className="flex items-center gap-2">
            <Filter size={12} style={{ color: "oklch(0.48 0.05 265)" }} />
            <span
              className="text-xs font-body"
              style={{ color: "oklch(0.48 0.05 265)" }}
            >
              Sort by:
            </span>
            {(["date", "rating"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                className="text-xs px-3 py-1 rounded-full font-body border transition-smooth"
                style={{
                  backgroundColor:
                    sortBy === s
                      ? "oklch(0.72 0.19 65 / 0.2)"
                      : "oklch(0.17 0.05 265)",
                  borderColor:
                    sortBy === s
                      ? "oklch(0.72 0.19 65 / 0.5)"
                      : "oklch(0.28 0.05 265)",
                  color:
                    sortBy === s
                      ? "oklch(0.85 0.15 65)"
                      : "oklch(0.55 0.05 265)",
                }}
                data-ocid={`founder_feedback.sort_${s}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Rating filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", 5, 4, 3, 2, 1] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatingFilter(r)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full font-body border transition-smooth"
                style={{
                  backgroundColor:
                    ratingFilter === r
                      ? "oklch(0.72 0.19 65 / 0.2)"
                      : "oklch(0.17 0.05 265)",
                  borderColor:
                    ratingFilter === r
                      ? "oklch(0.72 0.19 65 / 0.5)"
                      : "oklch(0.28 0.05 265)",
                  color:
                    ratingFilter === r
                      ? "oklch(0.85 0.15 65)"
                      : "oklch(0.55 0.05 265)",
                }}
                data-ocid={`founder_feedback.filter_rating.${r}`}
              >
                {r === "all" ? "All Stars" : `${r}★`}
              </button>
            ))}
          </div>

          {/* Module filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setModuleFilter("all")}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full font-body border transition-smooth"
              style={{
                backgroundColor:
                  moduleFilter === "all"
                    ? "oklch(0.50 0.15 265 / 0.25)"
                    : "oklch(0.17 0.05 265)",
                borderColor:
                  moduleFilter === "all"
                    ? "oklch(0.60 0.15 265 / 0.5)"
                    : "oklch(0.28 0.05 265)",
                color:
                  moduleFilter === "all"
                    ? "oklch(0.78 0.15 265)"
                    : "oklch(0.55 0.05 265)",
              }}
              data-ocid="founder_feedback.filter_module.all"
            >
              All Modules
            </button>
            {ALL_MODULES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModuleFilter(m)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full font-body border transition-smooth"
                style={{
                  backgroundColor:
                    moduleFilter === m
                      ? "oklch(0.50 0.15 265 / 0.25)"
                      : "oklch(0.17 0.05 265)",
                  borderColor:
                    moduleFilter === m
                      ? "oklch(0.60 0.15 265 / 0.5)"
                      : "oklch(0.28 0.05 265)",
                  color:
                    moduleFilter === m
                      ? "oklch(0.78 0.15 265)"
                      : "oklch(0.55 0.05 265)",
                }}
                data-ocid={`founder_feedback.filter_module.${m.toLowerCase().replace(/\s/g, "_")}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback list */}
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3"
            style={{ backgroundColor: "oklch(0.17 0.05 265)" }}
            data-ocid="founder_feedback.empty_state"
          >
            <Star size={36} style={{ color: "oklch(0.38 0.05 265)" }} />
            <p
              className="text-sm text-center font-body"
              style={{ color: "oklch(0.50 0.05 265)" }}
            >
              {moduleFilter !== "all" || ratingFilter !== "all"
                ? "No feedback matches your filters"
                : "No feedback received yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: "oklch(0.17 0.05 265)",
                  borderColor: "oklch(0.25 0.05 265)",
                }}
                data-ocid={`founder_feedback.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <StarDisplay rating={item.rating} />
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-0 px-2 py-0.5 font-body"
                      style={{
                        backgroundColor: "oklch(0.50 0.15 265 / 0.2)",
                        color: "oklch(0.75 0.15 265)",
                      }}
                    >
                      {item.module}
                    </Badge>
                    <span
                      className="text-xs font-body"
                      style={{ color: "oklch(0.42 0.05 265)" }}
                    >
                      {formatRelativeTime(item.submittedAt)}
                    </span>
                  </div>
                </div>
                <p
                  className="text-sm font-body leading-relaxed"
                  style={{ color: "oklch(0.78 0.04 265)" }}
                >
                  {item.comment}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Privacy footer */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: "oklch(0.20 0.08 65 / 0.12)" }}
        >
          <Shield size={12} style={{ color: "oklch(0.62 0.15 65)" }} />
          <p
            className="text-xs font-body"
            style={{ color: "oklch(0.55 0.08 65)" }}
          >
            All feedback is anonymized for privacy — no user names or contact
            details stored
          </p>
        </div>
      </div>
    </Layout>
  );
}
