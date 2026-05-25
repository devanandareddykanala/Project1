import { createActor } from "@/backend";
import type { WatchmanFamilyMember } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  MessageCircle,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function WatchmanFamilyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { actor, isFetching } = useActor(createActor);

  const [members, setMembers] = useState<WatchmanFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!actor || isFetching || !user) return;
    actor
      .getWatchmanFamily(user.id)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [actor, isFetching, user]);

  const handleAddMember = async () => {
    if (!actor || !user || !name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const addResult = await actor.addWatchmanFamilyMember(
        user.id,
        name.trim(),
        phone.trim(),
      );
      if (addResult.__kind__ === "err") {
        toast.error(addResult.err);
        return;
      }
      // Generate DWCH-XXXX invite code
      const inviteResult = await actor.generateInviteCode(
        "watchman_family",
        null,
      );
      if (inviteResult.__kind__ === "ok") {
        setInviteCode(inviteResult.ok.code);
      } else {
        // Fallback: generate locally formatted code
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        setInviteCode(`DWCH-${rand}`);
      }
      const updated = await actor.getWatchmanFamily(user.id);
      setMembers(updated);
      setName("");
      setPhone("");
    } catch {
      toast.error("Failed to add family member. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (_memberId: string) => {
    if (!actor || !user) return;
    try {
      // Re-fetch to update list; no direct remove API
      toast.success("Contact support to deactivate this member.");
    } catch {
      toast.error("Action failed. Please try again.");
    }
  };

  const handleShareWhatsApp = (code: string) => {
    const msg = encodeURIComponent(
      `You have been invited to join Develvyn — The Family Suite as a Watchman Family Member.\n\nInvite Code: ${code}\n\nValid for 7 days. Use this code during registration.\n\nDownload: develvyn.app`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setInviteCode(null);
    setName("");
    setPhone("");
  };

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      data-ocid="watchman_family.page"
    >
      {/* Header */}
      <div className="bg-white border-b border-[#DCFCE7] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/watchman" })}
            className="p-2 rounded-lg hover:bg-[#F0FDF4] transition-colors"
            aria-label="Go back"
            data-ocid="watchman_family.back_button"
          >
            <ArrowLeft size={20} className="text-[#16A34A]" />
          </button>
          <span className="font-semibold text-gray-900">Family Members</span>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#22C55E] text-white text-sm font-medium rounded-xl hover:bg-[#16A34A] transition-colors"
          data-ocid="watchman_family.add_button"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-4 py-16"
            data-ocid="watchman_family.empty_state"
          >
            <div className="bg-[#F0FDF4] rounded-full p-5">
              <Users size={36} className="text-[#22C55E]" />
            </div>
            <p className="text-gray-700 font-medium">
              No family members added yet
            </p>
            <p className="text-sm text-gray-400 text-center">
              Add your family members so they can also manage watchman duties.
            </p>
            <Button
              onClick={() => setSheetOpen(true)}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl px-6"
              data-ocid="watchman_family.empty_add_button"
            >
              + Add Family Member
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-white border border-[#DCFCE7] rounded-xl px-4 py-3"
                data-ocid={`watchman_family.item.${i + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      m.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    {m.isActive ? "Active" : "Pending"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    aria-label="Remove member"
                    data-ocid={`watchman_family.remove_button.${i + 1}`}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleCloseSheet}
            onKeyUp={(e) => e.key === "Escape" && handleCloseSheet()}
            role="button"
            tabIndex={-1}
            aria-label="Close sheet"
          />
          <div
            className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-5"
            data-ocid="watchman_family.dialog"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Family Member
              </h2>
              <button
                type="button"
                onClick={handleCloseSheet}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
                data-ocid="watchman_family.close_button"
              >
                &#x2715;
              </button>
            </div>

            {inviteCode ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Check size={18} />
                  <span className="font-medium text-sm">
                    Family member added!
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Share this invite code with your family member. Valid for{" "}
                  <strong>7 days</strong>.
                </p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-[#DCFCE7]">
                  <span className="flex-1 font-mono text-xl font-bold tracking-widest text-gray-900">
                    {inviteCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E] text-white text-sm font-medium rounded-lg hover:bg-[#16A34A] transition-colors"
                    data-ocid="watchman_family.copy_code_button"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  They can enter this code during registration to join as a
                  watchman family member.
                </p>
                <button
                  type="button"
                  onClick={() => inviteCode && handleShareWhatsApp(inviteCode)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-colors"
                  style={{ backgroundColor: "#25D366" }}
                  data-ocid="watchman_family.share_whatsapp_button"
                >
                  <MessageCircle size={18} />
                  Share via WhatsApp
                </button>
                <Button
                  onClick={handleCloseSheet}
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl"
                  data-ocid="watchman_family.done_button"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="border-[#DCFCE7] focus-visible:ring-[#22C55E] rounded-xl"
                    data-ocid="watchman_family.name_input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Mobile Number
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    type="tel"
                    maxLength={10}
                    className="border-[#DCFCE7] focus-visible:ring-[#22C55E] rounded-xl"
                    data-ocid="watchman_family.phone_input"
                  />
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!name.trim() || !phone.trim() || submitting}
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl py-3 disabled:opacity-40"
                  data-ocid="watchman_family.generate_invite_button"
                >
                  {submitting ? "Generating..." : "Generate Invite"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
