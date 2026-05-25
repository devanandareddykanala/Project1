import { createActor } from "@/backend";
import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import type { Notice } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { Bell, CheckCheck, Lock, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Priority = "normal" | "important" | "urgent";
type NoticeType = "general" | "maintenance" | "emergency" | "meeting";
type NoticeExt = Notice & {
  ackCount: number;
  important?: boolean;
  noticeType?: NoticeType;
};

function NoticeTypeBadge({ type }: { type?: NoticeType }) {
  const map: Record<NoticeType, { label: string; cls: string }> = {
    general: { label: "General", cls: "bg-gray-100 text-gray-600" },
    maintenance: {
      label: "Maintenance",
      cls: "bg-blue-50 text-blue-600 border border-blue-200",
    },
    emergency: {
      label: "Emergency",
      cls: "bg-red-50 text-red-600 border border-red-200",
    },
    meeting: {
      label: "Meeting",
      cls: "bg-purple-50 text-purple-600 border border-purple-200",
    },
  };
  const t = type ?? "general";
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${map[t].cls}`}
    >
      {map[t].label}
    </span>
  );
}

function PriorityBadge({
  priority,
  important,
}: { priority: string; important?: boolean }) {
  if (priority === "urgent")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold border border-red-200">
        Urgent
      </span>
    );
  if (important)
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-semibold">
        Important
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
      Normal
    </span>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function NoticeBoard() {
  const { user } = useAuthStore();
  const isSA = user?.role === "super_admin" || user?.role === "flat_admin";
  const userId = user?.id ?? "u1";
  const { actor } = useActor(createActor);
  const [notices, setNotices] = useState<NoticeExt[]>([]);

  const loadNotices = () => {
    if (!actor || !user?.apartmentId) return;
    actor
      .getNoticesForApartment(BigInt(String(user.apartmentId)))
      .then((raw) => {
        const mapped: NoticeExt[] = raw.map((n) => ({
          id: String(n.id),
          apartmentId: String(n.apartmentId),
          title: n.title,
          body: n.content,
          priority: n.priority === "Urgent" ? "urgent" : "normal",
          important: n.priority === "Important",
          postedBy: String(n.postedBy),
          postedAt: Number(n.postedAt) / 1_000_000,
          readBy: n.acknowledgedBy.map((id) => String(id)),
          ackCount: n.acknowledgedBy.length,
        }));
        setNotices(mapped);
      })
      .catch(() => {});
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadNotices is stable within this render
  useEffect(() => {
    loadNotices();
  }, [actor, user?.apartmentId]);
  const [showPost, setShowPost] = useState(false);
  const [active, setActive] = useState<NoticeExt | null>(null);
  const [editNotice, setEditNotice] = useState<NoticeExt | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal" as Priority,
    noticeType: "general" as NoticeType,
  });
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
  });

  const unread = notices.filter((n) => !n.readBy.includes(userId)).length;
  const sorted = [...notices].sort((a, b) => {
    if (a.priority === "urgent" && b.priority !== "urgent") return -1;
    if (b.priority === "urgent" && a.priority !== "urgent") return 1;
    return b.postedAt - a.postedAt;
  });

  const markRead = (id: string) => {
    setNotices((p) =>
      p.map((n) =>
        n.id === id && !n.readBy.includes(userId)
          ? { ...n, readBy: [...n.readBy, userId] }
          : n,
      ),
    );
    if (actor) {
      actor
        .acknowledgeNotice(BigInt(id))
        .then(loadNotices)
        .catch(() => {});
    }
  };

  const markAllRead = () => {
    setNotices((p) =>
      p.map((n) => ({
        ...n,
        readBy: n.readBy.includes(userId) ? n.readBy : [...n.readBy, userId],
      })),
    );
    toast.success("All notices marked as read");
  };

  const handlePost = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content required");
      return;
    }
    if (!actor || !user?.apartmentId) {
      toast.error("Not connected to backend");
      return;
    }
    const priorityMap = {
      normal: "Normal",
      important: "Important",
      urgent: "Urgent",
    } as const;
    actor
      .postNotice(
        BigInt(String(user.apartmentId)),
        form.title,
        form.content,
        priorityMap[form.priority] as import("@/backend").Priority,
      )
      .then((res) => {
        if (res.__kind__ === "ok") {
          toast.success("Notice posted");
          setShowPost(false);
          setForm({
            title: "",
            content: "",
            priority: "normal",
            noticeType: "general",
          });
          loadNotices();
        } else {
          toast.error(res.err ?? "Failed to post notice");
        }
      })
      .catch(() => toast.error("Failed to post notice"));
  };

  const handleEditSave = () => {
    if (!editNotice) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error("Title and content required");
      return;
    }
    setNotices((p) =>
      p.map((n) =>
        n.id === editNotice.id
          ? {
              ...n,
              title: editForm.title.trim(),
              body: editForm.content.trim(),
            }
          : n,
      ),
    );
    toast.success("Notice updated");
    setEditNotice(null);
  };

  const handleDelete = (id: string) => {
    const target = notices.find((n) => n.id === id);
    if (target && target.ackCount > 0) {
      toast.error("Cannot delete: notice has been acknowledged by residents");
      return;
    }
    setNotices((p) => p.filter((n) => n.id !== id));
    toast.success("Notice deleted");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white" data-ocid="notices.page">
        <div className="p-4 pb-24">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Notices</h1>
              {unread > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold"
                  data-ocid="notices.unread_badge"
                >
                  {unread}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-2 rounded-lg bg-white border border-[#DCFCE7] text-gray-500 hover:border-[#22C55E] transition-colors"
                  data-ocid="notices.mark_all_read_button"
                >
                  <CheckCheck size={18} />
                </button>
              )}
              {isSA && (
                <button
                  type="button"
                  onClick={() => setShowPost(true)}
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                  data-ocid="notices.post_button"
                >
                  Post Notice
                </button>
              )}
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-16" data-ocid="notices.empty_state">
              <Bell size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-600">
                No notices yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Notices posted by the Super Admin will appear here
              </p>
              {isSA && (
                <button
                  type="button"
                  onClick={() => setShowPost(true)}
                  className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  Post First Notice
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3" data-ocid="notices.list">
              {sorted.map((notice, i) => {
                const isUnread = !notice.readBy.includes(userId);
                const isUrgent = notice.priority === "urgent";
                const isLocked = notice.ackCount > 0;
                return (
                  <div
                    key={notice.id}
                    className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-2 ${
                      isUrgent ? "border-red-300" : "border-[#DCFCE7]"
                    }`}
                    data-ocid={`notices.item.${i + 1}`}
                  >
                    <button
                      type="button"
                      className="flex flex-col gap-2 text-left w-full"
                      onClick={() => {
                        setActive(notice);
                        markRead(notice.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-semibold flex-1 min-w-0 ${
                            isUnread ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {isUnread && (
                            <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle bg-[#22C55E]" />
                          )}
                          {notice.title}
                        </p>
                        <PriorityBadge
                          priority={notice.priority}
                          important={notice.important}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <NoticeTypeBadge type={notice.noticeType} />
                        <p className="text-xs text-gray-500">
                          {notice.postedBy} · {timeAgo(notice.postedAt)}
                        </p>
                        <p className="text-xs text-gray-400 ml-auto">
                          {notice.ackCount} read
                        </p>
                      </div>
                    </button>
                    {isSA && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#DCFCE7]">
                        {isLocked ? (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Lock size={11} />
                            Locked — {notice.ackCount} resident
                            {notice.ackCount !== 1 ? "s" : ""} acknowledged
                          </p>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditNotice(notice);
                                setEditForm({
                                  title: notice.title,
                                  content: notice.body,
                                });
                              }}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#22C55E] transition-colors"
                              data-ocid={`notices.edit_button.${i + 1}`}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(notice.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                              data-ocid={`notices.delete_button.${i + 1}`}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notice Detail */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="notices.notice_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto pb-8">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex-1">
                {active.title}
              </h2>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="text-gray-400"
                data-ocid="notices.close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge
                priority={active.priority}
                important={active.important}
              />
              <span className="text-xs text-gray-500">
                {active.postedBy} · {timeAgo(active.postedAt)}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {active.body}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-[#DCFCE7]">
              <p className="text-xs text-gray-400">
                {active.ackCount} residents read this
              </p>
              {!active.readBy.includes(userId) && (
                <button
                  type="button"
                  onClick={() => {
                    markRead(active.id);
                    setActive(null);
                  }}
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                  data-ocid="notices.acknowledge_button"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {editNotice && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="notices.edit_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Notice</h2>
              <button
                type="button"
                onClick={() => setEditNotice(null)}
                className="text-gray-400"
                data-ocid="notices.edit_close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label
                htmlFor="edit-not-title"
                className="text-xs text-gray-500 mb-1 block"
              >
                Title
              </label>
              <input
                id="edit-not-title"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                data-ocid="notices.edit_title_input"
              />
            </div>
            <div>
              <label
                htmlFor="edit-not-body"
                className="text-xs text-gray-500 mb-1 block"
              >
                Content
              </label>
              <textarea
                id="edit-not-body"
                rows={4}
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm resize-none"
                value={editForm.content}
                onChange={(e) =>
                  setEditForm({ ...editForm, content: e.target.value })
                }
                data-ocid="notices.edit_content_textarea"
              />
            </div>
            <button
              type="button"
              onClick={handleEditSave}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors"
              data-ocid="notices.edit_submit_button"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Post Notice */}
      {showPost && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          data-ocid="notices.post_dialog"
        >
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 flex flex-col gap-4 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Post Notice</h2>
              <button
                type="button"
                onClick={() => setShowPost(false)}
                className="text-gray-400"
                data-ocid="notices.post_close_button"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label
                htmlFor="not-title"
                className="text-xs text-gray-500 mb-1 block"
              >
                Title
              </label>
              <input
                id="not-title"
                placeholder="e.g. Water shutdown on Sunday"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-ocid="notices.title_input"
              />
            </div>
            <div>
              <label
                htmlFor="not-body"
                className="text-xs text-gray-500 mb-1 block"
              >
                Content
              </label>
              <textarea
                id="not-body"
                rows={4}
                placeholder="Full notice details…"
                className="w-full border border-[#DCFCE7] focus:border-[#22C55E] focus:outline-none rounded-lg px-3 py-2 text-gray-900 text-sm resize-none"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                data-ocid="notices.content_textarea"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Notice Type</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(
                  [
                    "general",
                    "maintenance",
                    "emergency",
                    "meeting",
                  ] as NoticeType[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, noticeType: t })}
                    className={`py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      form.noticeType === t
                        ? "bg-[#22C55E] text-white"
                        : "bg-white border border-[#DCFCE7] text-gray-600 hover:border-[#22C55E]"
                    }`}
                    data-ocid={`notices.type.${t}`}
                  >
                    {t === "maintenance"
                      ? "Maintenance"
                      : t === "emergency"
                        ? "Emergency"
                        : t === "meeting"
                          ? "Meeting"
                          : "General"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Priority</p>
              <div className="flex gap-2">
                {(["normal", "important", "urgent"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      form.priority === p
                        ? p === "urgent"
                          ? "bg-red-500 text-white"
                          : p === "important"
                            ? "bg-[#22C55E] text-white"
                            : "bg-gray-100 text-gray-700 border border-gray-300"
                        : "bg-white border border-[#DCFCE7] text-gray-600 hover:border-[#22C55E]"
                    }`}
                    data-ocid={`notices.priority.${p}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handlePost}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold py-3 rounded-lg transition-colors"
              data-ocid="notices.submit_button"
            >
              Post to All Residents
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
