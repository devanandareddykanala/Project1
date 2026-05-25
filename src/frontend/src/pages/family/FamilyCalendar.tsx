import { createActor } from "@/backend";

const RECURRENCE_OPTIONS = ["Once", "Daily", "Weekly", "Monthly"];
import type { FamilyCalendarEvent } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function FamilyCalendar() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [reminder, setReminder] = useState("");
  const [recurrence, setRecurrence] = useState("Once");

  const { data: events = [], isLoading } = useQuery<FamilyCalendarEvent[]>({
    queryKey: ["calendarEvents"],
    queryFn: async () => (actor ? actor.listCalendarEvents() : []),
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !eventTitle.trim() || !date)
        throw new Error("Title and date required");
      await actor.addCalendarEvent(
        eventTitle.trim(),
        description.trim(),
        BigInt(new Date(date || Date.now()).getTime()) * 1_000_000n,
        time,
        null,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendarEvents"] });
      setOpen(false);
      setEventTitle("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setTime("09:00");
      setReminder("");
      toast.success("Event added");
    },
    onError: () => toast.error("Could not add event"),
  });

  const upcoming = events
    .filter(
      (e) =>
        new Date(Number(e.date) / 1_000_000) >=
        new Date(new Date().toDateString()),
    )
    .sort((a, b) => Number(a.date - b.date));
  const past = events
    .filter(
      (e) =>
        new Date(Number(e.date) / 1_000_000) <
        new Date(new Date().toDateString()),
    )
    .sort((a, b) => Number(b.date - a.date));

  return (
    <Layout>
      <div
        className="min-h-screen bg-white pb-24"
        data-ocid="family_calendar.page"
      >
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">
              Family Mode
            </p>
            <h1 className="text-2xl font-bold text-[#111827]">Calendar</h1>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-ocid="family_calendar.add_button"
            className="w-10 h-10 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center shadow-sm transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="px-4" data-ocid="family_calendar.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-16 mb-3 animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div
            className="mx-4 rounded-xl border border-[#DCFCE7] bg-white p-10 flex flex-col items-center gap-3"
            data-ocid="family_calendar.empty_state"
          >
            <CalendarDays size={36} className="text-[#DCFCE7]" />
            <p className="text-sm text-[#6b7280] text-center">
              No events today. Tap + to add one.
            </p>
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-4">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                  Upcoming
                </h2>
                <div className="flex flex-col gap-2">
                  {upcoming.map((ev, idx) => (
                    <div
                      key={ev.id.toString()}
                      className="bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4"
                      data-ocid={`family_calendar.item.${idx + 1}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                          <CalendarDays size={18} className="text-[#22C55E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111827]">
                            {ev.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock size={11} className="text-[#6b7280]" />
                            <span className="text-xs text-[#6b7280]">
                              {new Date(
                                Number(ev.date) / 1_000_000,
                              ).toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                              {ev.time ? ` · ${ev.time}` : ""}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="text-xs text-[#6b7280] mt-1 line-clamp-1">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                  Past
                </h2>
                <div className="flex flex-col gap-2 opacity-60">
                  {past.map((ev, idx) => (
                    <div
                      key={ev.id.toString()}
                      className="bg-white rounded-xl border border-[#DCFCE7] p-4"
                      data-ocid={`family_calendar.past_item.${idx + 1}`}
                    >
                      <p className="text-sm font-medium text-[#111827]">
                        {ev.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={11} className="text-[#6b7280]" />
                        <span className="text-xs text-[#6b7280]">
                          {new Date(
                            Number(ev.date) / 1_000_000,
                          ).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {ev.time ? ` · ${ev.time}` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            data-ocid="family_calendar.dialog"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-label="Close"
            />
            <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[#111827] text-lg">
                  Add Event
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  data-ocid="family_calendar.close_button"
                >
                  <X size={20} className="text-[#6b7280]" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="cal-title"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Title *
                  </label>
                  <input
                    id="cal-title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Family dinner"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_calendar.title_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cal-desc"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Description
                  </label>
                  <input
                    id="cal-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional details"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_calendar.description_input"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="cal-date"
                      className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                    >
                      Date *
                    </label>
                    <input
                      id="cal-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                      data-ocid="family_calendar.date_input"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="cal-time"
                      className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                    >
                      Time
                    </label>
                    <input
                      id="cal-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                      data-ocid="family_calendar.time_input"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="cal-recurrence"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Recurrence
                  </label>
                  <div className="flex gap-2" id="cal-recurrence">
                    {RECURRENCE_OPTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRecurrence(r)}
                        data-ocid={`family_calendar.recurrence.${r.toLowerCase()}`}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                          recurrence === r
                            ? "bg-[#22C55E] text-white border-[#22C55E]"
                            : "bg-white text-[#16A34A] border-[#DCFCE7]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="cal-reminder"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Reminder Note (optional)
                  </label>
                  <input
                    id="cal-reminder"
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    placeholder="e.g. Remind everyone a day before"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_calendar.reminder_input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addMutation.mutate()}
                  disabled={
                    addMutation.isPending || !eventTitle.trim() || !date
                  }
                  data-ocid="family_calendar.submit_button"
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {addMutation.isPending ? "Saving..." : "Add Event"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
