import { type TaskPriority, TaskStatus, createActor } from "@/backend";
import type { FamilyTask } from "@/backend";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Plus, Square, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Priority = "Low" | "Medium" | "High";
type FilterType = "All" | "Pending" | "Completed";

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-blue-100 text-blue-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-red-700",
};

function formatDueDate(ts: bigint | undefined): string {
  if (!ts || ts === 0n) return "";
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function FamilyTasks() {
  const { actor, isFetching } = useActor(createActor);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("All");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDate, setDueDate] = useState("");

  const { data: tasks = [], isLoading } = useQuery<FamilyTask[]>({
    queryKey: ["familyTasks"],
    queryFn: async () => (actor ? actor.listFamilyTasks() : []),
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !title.trim()) throw new Error("Title required");
      const due = dueDate
        ? BigInt(new Date(dueDate).getTime()) * 1_000_000n
        : 0n;
      await actor.addFamilyTask(
        title.trim(),
        description.trim(),
        assignedTo.trim(),
        due,
        priority as TaskPriority,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["familyTasks"] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("Medium");
      setDueDate("");
      toast.success("Task added");
    },
    onError: () => toast.error("Could not add task"),
  });

  const doneMutation = useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Task not found");
      await actor.updateFamilyTask(
        taskId,
        task.title,
        task.description || "",
        task.assignedTo || "",
        task.dueDate ?? null,
        TaskStatus.Done,
        task.priority,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["familyTasks"] }),
    onError: () => toast.error("Could not update task"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteFamilyTask(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["familyTasks"] });
      toast.success("Task deleted");
    },
    onError: () => toast.error("Could not delete task"),
  });

  const canEditDelete = (task: FamilyTask) =>
    task.principalId.toString() === user?.principal ||
    (user?.role as string) === "family_head";

  const filtered = tasks.filter((t) => {
    if (filter === "Pending") return t.status !== TaskStatus.Done;
    if (filter === "Completed") return t.status === TaskStatus.Done;
    return true;
  });

  const priorities: Priority[] = ["Low", "Medium", "High"];
  const filters: FilterType[] = ["All", "Pending", "Completed"];

  return (
    <Layout>
      <div
        className="min-h-screen bg-white pb-24"
        data-ocid="family_tasks.page"
      >
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">
              Family Mode
            </p>
            <h1 className="text-2xl font-bold text-[#111827]">Tasks</h1>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-ocid="family_tasks.add_button"
            className="w-10 h-10 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center shadow-sm transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="px-4 flex gap-2 mb-4">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              data-ocid={`family_tasks.filter.${f.toLowerCase()}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#22C55E] text-white"
                  : "bg-white text-[#16A34A] border border-[#DCFCE7]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="px-4" data-ocid="family_tasks.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-16 mb-3 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="mx-4 rounded-xl border border-[#DCFCE7] bg-white p-10 flex flex-col items-center gap-3"
            data-ocid="family_tasks.empty_state"
          >
            <CheckSquare size={36} className="text-[#DCFCE7]" />
            <p className="text-sm text-[#6b7280] text-center">
              Nothing pending. Enjoy the day.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
              data-ocid="family_tasks.add_first_button"
            >
              Add First Task
            </button>
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-2">
            {filtered.map((task, idx) => {
              const isDone = task.status === TaskStatus.Done;
              const isOverdue =
                !isDone &&
                task.dueDate &&
                task.dueDate > 0n &&
                Date.now() > Number(task.dueDate) / 1_000_000;
              return (
                <div
                  key={task.id.toString()}
                  className={`bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 ${
                    isOverdue
                      ? "border-l-4 border-amber-400 border border-[#DCFCE7]"
                      : "border border-[#DCFCE7]"
                  }`}
                  data-ocid={`family_tasks.item.${idx + 1}`}
                >
                  <button
                    type="button"
                    onClick={() => !isDone && doneMutation.mutate(task.id)}
                    data-ocid={`family_tasks.checkbox.${idx + 1}`}
                    className="mt-0.5 flex-shrink-0"
                    aria-label={isDone ? "Completed" : "Mark complete"}
                  >
                    {isDone ? (
                      <CheckSquare size={20} className="text-[#22C55E]" />
                    ) : (
                      <Square size={20} className="text-[#DCFCE7]" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isDone
                          ? "line-through text-[#6b7280]"
                          : isOverdue
                            ? "text-red-600"
                            : "text-[#111827]"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority as Priority] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {task.priority}
                      </span>
                      {task.assignedTo && (
                        <span className="text-xs text-[#6b7280]">
                          → {task.assignedTo}
                        </span>
                      )}
                      {task.dueDate ? (
                        <span
                          className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-[#6b7280]"}`}
                        >
                          {isOverdue ? "Overdue" : "Due"}{" "}
                          {formatDueDate(task.dueDate)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {canEditDelete(task) && (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(task.id)}
                      data-ocid={`family_tasks.delete_button.${idx + 1}`}
                      aria-label="Delete task"
                      className="flex-shrink-0 text-[#DCFCE7] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            data-ocid="family_tasks.dialog"
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
                  Add Task
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  data-ocid="family_tasks.close_button"
                >
                  <X size={20} className="text-[#6b7280]" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="task-title"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Title *
                  </label>
                  <input
                    id="task-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Pay electricity bill"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_tasks.title_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="task-description"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Description
                  </label>
                  <input
                    id="task-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional details"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_tasks.description_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="task-assignee"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Assign To
                  </label>
                  <input
                    id="task-assignee"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Priya"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_tasks.assignee_input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="task-priority"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Priority
                  </label>
                  <div id="task-priority" className="flex gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        data-ocid={`family_tasks.priority.${p.toLowerCase()}`}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                          priority === p
                            ? "bg-[#22C55E] text-white border-[#22C55E]"
                            : "bg-white text-[#16A34A] border-[#DCFCE7]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Due Date
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="family_tasks.due_date_input"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending || !title.trim()}
                  data-ocid="family_tasks.submit_button"
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {addMutation.isPending ? "Saving..." : "Add Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
