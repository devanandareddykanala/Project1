import { createActor } from "@/backend";
import { DocumentType, type DocumentVaultEntry } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { FileText, Lock, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DOC_TYPES: DocumentType[] = [
  DocumentType.Aadhaar,
  DocumentType.PAN,
  DocumentType.Property,
  DocumentType.Insurance,
  DocumentType.Vehicle,
  DocumentType.Other,
];

const DOC_LABELS: Record<DocumentType, string> = {
  Aadhaar: "Aadhaar Card",
  PAN: "PAN Card",
  Property: "Property Document",
  Insurance: "Insurance Policy",
  Vehicle: "Vehicle RC",
  Other: "Other",
};

export function DocumentVault() {
  const { actor } = useActor(createActor);
  const [docs, setDocs] = useState<DocumentVaultEntry[]>([]);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>(DocumentType.Other);
  const [note, setNote] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!actor) return;
    actor.listDocuments().then(setDocs).catch(console.error);
  }, [actor]);

  const _onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFileUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const add = async () => {
    if (!actor || !title.trim()) return;
    setLoading(true);
    try {
      await actor.addDocument(title.trim(), docType, note.trim(), fileUrl);
      const updated = await actor.listDocuments();
      setDocs(updated);
      setTitle("");
      setNote("");
      setFileUrl("");
      if (fileRef.current) fileRef.current.value = "";
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
      await actor.deleteDocument(id);
      setDocs((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-4" data-ocid="doc_vault.page">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">
                LOCKER
              </h1>
              <p className="text-xs text-muted-foreground">
                Document Vault · Private
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((p) => !p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            data-ocid="doc_vault.add_button"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-ocid="doc_vault.title_input"
            />
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none resize-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Note (optional)"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-ocid="doc_vault.note_textarea"
            />
            {/* File upload */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 px-3 py-2 w-full cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} className="text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {fileUrl ? "File selected ✓" : "Attach file (optional)"}
              </span>
            </button>
            <div className="flex gap-1.5 flex-wrap">
              {DOC_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    docType === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`doc_vault.type_${t.toLowerCase()}`}
                >
                  {DOC_LABELS[t]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={add}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
              data-ocid="doc_vault.submit_button"
            >
              {loading ? "Saving..." : "Save Document"}
            </button>
          </div>
        )}

        {/* Document list */}
        <div className="space-y-2" data-ocid="doc_vault.list">
          {docs.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5"
              data-ocid="doc_vault.empty_state"
            >
              <Upload size={36} className="text-primary/40 mb-3" />
              <p className="text-sm font-body font-medium text-foreground">
                No documents saved yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Keep Aadhaar, PAN, property docs & more here
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-lg text-xs font-mono border-2 border-dashed border-primary/60 text-primary hover:bg-primary/10 transition-colors"
              >
                Tap to add document
              </button>
            </div>
          )}
          {docs.map((doc, i) => (
            <div
              key={String(doc.id)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
              data-ocid={`doc_vault.item.${i + 1}`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium truncate text-foreground">
                  {doc.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {DOC_LABELS[doc.docType]}
                  {doc.note ? ` · ${doc.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(doc.id)}
                data-ocid={`doc_vault.delete_button.${i + 1}`}
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
    </Layout>
  );
}
