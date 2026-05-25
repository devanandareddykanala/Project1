import { createActor } from "@/backend";
import { type HealthRecord, HealthRecordType } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { Heart, Lock, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const RECORD_TYPES: HealthRecordType[] = [
  HealthRecordType.Vaccination,
  HealthRecordType.Report,
  HealthRecordType.Prescription,
  HealthRecordType.Other,
];

const TYPE_LABELS: Record<HealthRecordType, string> = {
  Vaccination: "Vaccination",
  Report: "Lab Report",
  Prescription: "Prescription",
  Other: "General Note",
};

const TYPE_CLASSES: Record<HealthRecordType, string> = {
  Prescription: "text-destructive bg-destructive/20",
  Report: "text-primary bg-primary/20",
  Vaccination: "text-emerald-600 bg-emerald-100",
  Other: "text-yellow-600 bg-yellow-100",
};

export function HealthRecords() {
  const { actor } = useActor(createActor);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [memberName, setMemberName] = useState("");
  const [recType, setRecType] = useState<HealthRecordType>(
    HealthRecordType.Other,
  );
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor.listHealthRecords().then(setRecords).catch(console.error);
  }, [actor]);

  const members = [...new Set(records.map((r) => r.memberName))];

  const add = async () => {
    if (!actor || !memberName.trim() || !title.trim()) return;
    setLoading(true);
    try {
      await actor.addHealthRecord(
        memberName.trim(),
        recType,
        title.trim(),
        note.trim(),
        BigInt(Date.now() * 1_000_000),
        "",
      );
      const updated = await actor.listHealthRecords();
      setRecords(updated);
      setMemberName("");
      setTitle("");
      setNote("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: bigint) => {
    if (!actor) return;
    try {
      await actor.deleteHealthRecord(id);
      setRecords((p) => p.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-4" data-ocid="health_records.page">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">
                VITAL
              </h1>
              <p className="text-xs text-muted-foreground">
                Health Records · Private
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((p) => !p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            data-ocid="health_records.add_button"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Member name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              data-ocid="health_records.member_input"
            />
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Record title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-ocid="health_records.title_input"
            />
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none resize-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Note (optional)"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-ocid="health_records.note_textarea"
            />
            <div className="flex gap-1.5 flex-wrap">
              {RECORD_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRecType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    recType === t
                      ? TYPE_CLASSES[t]
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`health_records.type_${t.toLowerCase()}`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={add}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
              data-ocid="health_records.submit_button"
            >
              {loading ? "Saving..." : "Save Record"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-card/50"
            data-ocid="health_records.empty_state"
          >
            <Heart size={36} className="text-primary/40 mb-3" />
            <p className="text-sm font-body font-medium text-foreground">
              No health records yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Keep prescriptions, reports & vaccines in one place
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Add first record
            </button>
          </div>
        )}

        {/* Grouped by member */}
        {members.map((member) => (
          <div
            key={member}
            data-ocid={`health_records.member_${member.toLowerCase().replace(/\s+/g, "_")}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground font-mono">
              {member}
            </p>
            <div className="space-y-2">
              {records
                .filter((r) => r.memberName === member)
                .map((r, i) => (
                  <div
                    key={String(r.id)}
                    className="flex items-start gap-3 px-3 py-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
                    data-ocid={`health_records.item.${i + 1}`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold flex-shrink-0 mt-0.5 ${TYPE_CLASSES[r.recordType]}`}
                    >
                      {TYPE_LABELS[r.recordType]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-foreground">
                        {r.title}
                      </p>
                      {r.note && (
                        <p className="text-xs mt-0.5 text-muted-foreground">
                          {r.note}
                        </p>
                      )}
                      <p className="text-xs mt-0.5 text-muted-foreground">
                        {new Date(
                          Number(r.date) / 1_000_000,
                        ).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      data-ocid={`health_records.delete_button.${i + 1}`}
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
        ))}
      </div>
    </Layout>
  );
}
