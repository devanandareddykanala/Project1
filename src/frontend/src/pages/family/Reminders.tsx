import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import type { Reminder } from "@/types";
import { Bell, BellOff, Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const REPEAT_TYPES: Reminder["repeatType"][] = [
  "none",
  "daily",
  "weekly",
  "monthly",
];
const REPEAT_LABELS: Record<Reminder["repeatType"], string> = {
  none: "Once",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const reminderTodayBase = new Date();
const reminderTodayStr = reminderTodayBase.toISOString().split("T")[0];
const reminderTomorrowStr = new Date(reminderTodayBase.getTime() + 86400000)
  .toISOString()
  .split("T")[0];
const reminderWeekStr = new Date(reminderTodayBase.getTime() + 7 * 86400000)
  .toISOString()
  .split("T")[0];

type Section = "Today" | "Tomorrow" | "This Week" | "Later";

function getSection(date: string): Section {
  if (date === reminderTodayStr) return "Today";
  if (date === reminderTomorrowStr) return "Tomorrow";
  if (date <= reminderWeekStr) return "This Week";
  return "Later";
}

export function Reminders() {
  const { user: _user } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(reminderTodayStr);
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState<Reminder["repeatType"]>("none");
  const [showForm, setShowForm] = useState(false);

  const add = () => {
    if (!title.trim()) return;
    const r: Reminder = {
      id: String(Date.now()),
      title: title.trim(),
      date,
      time,
      repeatType: repeat,
      isActive: true,
      createdAt: Date.now(),
    };
    setReminders((p) => [r, ...p]);
    setTitle("");
    setShowForm(false);
  };

  const toggle = (id: string) =>
    setReminders((p) =>
      p.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
    );

  const remove = (id: string) =>
    setReminders((p) => p.filter((r) => r.id !== id));

  const sections: Section[] = ["Today", "Tomorrow", "This Week", "Later"];

  return (
    <Layout>
      <div className="p-4 space-y-4" data-ocid="reminders.page">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">
              CADENCE
            </h1>
            <p className="text-xs text-muted-foreground">Reminders & alerts</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((p) => !p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            data-ocid="reminders.add_button"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Reminder title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-ocid="reminders.title_input"
            />
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-ocid="reminders.date_input"
              />
              <input
                type="time"
                className="w-28 rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                data-ocid="reminders.time_input"
              />
            </div>
            <div className="flex gap-1.5">
              {REPEAT_TYPES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRepeat(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    repeat === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`reminders.repeat_${r}`}
                >
                  {REPEAT_LABELS[r]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={add}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              data-ocid="reminders.submit_button"
            >
              Set Reminder
            </button>
          </div>
        )}

        {/* Empty state */}
        {reminders.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-card/50"
            data-ocid="reminders.empty_state"
          >
            <Clock size={36} className="text-primary/40 mb-3" />
            <p className="text-sm font-body font-medium text-foreground">
              No reminders set
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Set reminders for bills, medicines & more
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Set first reminder
            </button>
          </div>
        )}

        {/* Sections */}
        {sections.map((section) => {
          const sectionItems = reminders.filter(
            (r) => getSection(r.date) === section,
          );
          if (sectionItems.length === 0) return null;
          return (
            <div
              key={section}
              data-ocid={`reminders.section_${section.toLowerCase().replace(" ", "_")}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground font-mono">
                {section}
              </p>
              <div className="space-y-2">
                {sectionItems.map((r, i) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors ${
                      r.isActive ? "" : "opacity-50"
                    }`}
                    data-ocid={`reminders.item.${i + 1}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(r.id)}
                      data-ocid={`reminders.toggle.${i + 1}`}
                    >
                      {r.isActive ? (
                        <Bell size={18} className="text-primary" />
                      ) : (
                        <BellOff size={18} className="text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-foreground">
                        {r.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.time} · {REPEAT_LABELS[r.repeatType]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      data-ocid={`reminders.delete_button.${i + 1}`}
                    >
                      <Trash2
                        size={14}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
