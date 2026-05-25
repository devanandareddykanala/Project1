import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/store/auth";
import type { FamilyContact } from "@/types";
import { Phone, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

const RELATIONS: FamilyContact["relation"][] = [
  "spouse",
  "parent",
  "sibling",
  "child",
  "friend",
  "doctor",
  "other",
];

const REL_LABELS: Record<FamilyContact["relation"], string> = {
  spouse: "Spouse",
  parent: "Parent",
  sibling: "Sibling",
  child: "Child",
  friend: "Friend",
  doctor: "Doctor",
  other: "Other",
};

const REL_BADGE: Record<FamilyContact["relation"], string> = {
  spouse: "bg-pink-500/20 text-pink-400",
  parent: "bg-yellow-500/20 text-yellow-400",
  sibling: "bg-primary/20 text-primary",
  child: "bg-emerald-500/20 text-emerald-400",
  friend: "bg-cyan-500/20 text-cyan-400",
  doctor: "bg-destructive/20 text-destructive",
  other: "bg-secondary text-muted-foreground",
};

export function FamilyContacts() {
  const { user: _user } = useAuthStore();
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState<FamilyContact["relation"]>("other");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const grouped = RELATIONS.reduce<Record<string, FamilyContact[]>>(
    (acc, rel) => {
      const group = contacts.filter((c) => c.relation === rel);
      if (group.length > 0) acc[rel] = group;
      return acc;
    },
    {},
  );

  const add = () => {
    if (!name.trim() || !phone.trim()) return;
    const contact: FamilyContact = {
      id: String(Date.now()),
      name: name.trim(),
      phone: phone.trim(),
      relation,
      note: note.trim() || undefined,
      createdAt: Date.now(),
    };
    setContacts((p) => [...p, contact]);
    setName("");
    setPhone("");
    setNote("");
    setShowForm(false);
  };

  return (
    <Layout>
      <div className="p-4 space-y-4" data-ocid="family_contacts.page">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">
              DIRECTORY
            </h1>
            <p className="text-xs text-muted-foreground">Family contacts</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((p) => !p)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            data-ocid="family_contacts.add_button"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="family_contacts.name_input"
            />
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-ocid="family_contacts.phone_input"
            />
            <input
              className="w-full rounded-lg px-3 py-2 text-sm font-body outline-none bg-secondary/50 text-foreground border border-input focus:border-primary transition-colors"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-ocid="family_contacts.note_input"
            />
            <div className="flex gap-1.5 flex-wrap">
              {RELATIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRelation(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    relation === r
                      ? REL_BADGE[r]
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`family_contacts.rel_${r}`}
                >
                  {REL_LABELS[r]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={add}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              data-ocid="family_contacts.submit_button"
            >
              Add Contact
            </button>
          </div>
        )}

        {/* Empty state */}
        {contacts.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border bg-card/50"
            data-ocid="family_contacts.empty_state"
          >
            <Users size={36} className="text-primary/40 mb-3" />
            <p className="text-sm font-body font-medium text-foreground">
              No contacts saved yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add emergency & important family contacts
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Add first contact
            </button>
          </div>
        )}

        {/* Grouped contacts */}
        {Object.entries(grouped).map(([rel, group]) => (
          <div key={rel}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground font-mono">
              {REL_LABELS[rel as FamilyContact["relation"]]}
            </p>
            <div className="space-y-2">
              {group.map((contact, i) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors"
                  data-ocid={`family_contacts.item.${i + 1}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${REL_BADGE[contact.relation]}`}
                  >
                    {contact.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-foreground">
                      {contact.name}
                    </p>
                    {contact.note && (
                      <p className="text-xs text-muted-foreground">
                        {contact.note}
                      </p>
                    )}
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/20 hover:bg-primary/30 transition-colors"
                    data-ocid={`family_contacts.call_button.${i + 1}`}
                    aria-label={`Call ${contact.name}`}
                  >
                    <Phone size={16} className="text-primary" />
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setContacts((p) => p.filter((x) => x.id !== contact.id))
                    }
                    data-ocid={`family_contacts.delete_button.${i + 1}`}
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
