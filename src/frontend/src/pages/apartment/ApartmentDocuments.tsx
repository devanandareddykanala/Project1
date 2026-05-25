import { Layout } from "@/components/Layout";
import { Archive, Eye, FileText, Replace, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";

type Doc = {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  viewCount: number;
  archived?: boolean;
};

export function ApartmentDocuments() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const handleFilePick = () => {
    if (!isSuperAdmin) return;
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newDocs: Doc[] = files.map((f) => ({
      id: `doc${Date.now()}-${f.name}`,
      name: f.name,
      size:
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`,
      uploadedAt: new Date().toLocaleDateString("en-IN"),
      uploadedBy: user?.name ?? "Super Admin",
      viewCount: 0,
    }));
    setDocs((prev) => [...newDocs, ...prev]);
    toast.success(
      `${files.length} document${files.length > 1 ? "s" : ""} uploaded`,
    );
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length || !isSuperAdmin) return;
    const newDocs: Doc[] = files.map((f) => ({
      id: `doc${Date.now()}-${f.name}`,
      name: f.name,
      size:
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`,
      uploadedAt: new Date().toLocaleDateString("en-IN"),
      uploadedBy: user?.name ?? "Super Admin",
      viewCount: 0,
    }));
    setDocs((prev) => [...newDocs, ...prev]);
    toast.success(
      `${files.length} document${files.length > 1 ? "s" : ""} uploaded`,
    );
  };

  const handleArchive = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, archived: true } : d)),
    );
    toast.success("Document archived");
  };

  const handleDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document deleted");
  };

  const handleView = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, viewCount: d.viewCount + 1 } : d)),
    );
  };

  const activeDocs = docs.filter((d) => !d.archived);
  const archivedDocs = docs.filter((d) => d.archived);

  return (
    <Layout>
      <div
        className="p-4 bg-white min-h-screen pb-24"
        data-ocid="documents.page"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Important building documents
            </p>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleFilePick}
              className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors"
              data-ocid="documents.upload_button"
            >
              <Upload size={15} />
              Upload
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          multiple
          onChange={handleFileChange}
        />

        {/* Skeleton loading */}
        {loading ? (
          <div
            className="flex flex-col gap-3"
            data-ocid="documents.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-16 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Upload Drop Zone — Super Admin only, when no active docs */}
            {isSuperAdmin && activeDocs.length === 0 && (
              <button
                type="button"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={handleFilePick}
                className={`w-full border-2 border-dashed rounded-2xl p-8 mb-4 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-[#22C55E] bg-green-50"
                    : "border-gray-200 hover:border-[#22C55E] hover:bg-green-50"
                }`}
                data-ocid="documents.dropzone"
              >
                <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex items-center justify-center mx-auto mb-3">
                  <Upload size={22} className="text-[#22C55E]" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Drop files here or tap to browse
                </p>
                <p className="text-xs text-gray-400">
                  PDF, Word, or images accepted
                </p>
              </button>
            )}

            {/* Document List or Empty State */}
            {activeDocs.length > 0 ? (
              <div className="space-y-3" data-ocid="documents.list">
                {activeDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 bg-white border border-[#DCFCE7] rounded-xl p-4 shadow-sm"
                    data-ocid={`documents.item.${idx + 1}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-[#22C55E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.size} · {doc.uploadedAt} · by {doc.uploadedBy}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Eye size={11} className="text-gray-300" />
                        <span className="text-xs text-gray-400">
                          {doc.viewCount}{" "}
                          {doc.viewCount === 1 ? "view" : "views"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleView(doc.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#22C55E] hover:bg-green-50 transition-colors"
                        aria-label="View document"
                        data-ocid={`documents.view_button.${idx + 1}`}
                      >
                        <Eye size={14} />
                      </button>
                      {isSuperAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleFilePick()}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            aria-label="Replace document"
                            title="Replace"
                            data-ocid={`documents.replace_button.${idx + 1}`}
                          >
                            <Replace size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(doc.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                            aria-label="Archive document"
                            title="Archive"
                            data-ocid={`documents.archive_button.${idx + 1}`}
                          >
                            <Archive size={14} />
                          </button>
                          {doc.viewCount === 0 && (
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              aria-label="Delete document"
                              title="Delete (0 views)"
                              data-ocid={`documents.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add more — SA drop zone when list has items */}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleFilePick}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors mt-2 ${
                      dragOver
                        ? "border-[#22C55E] bg-green-50"
                        : "border-gray-200 hover:border-[#22C55E]"
                    }`}
                    data-ocid="documents.add_more_button"
                  >
                    <span className="text-xs text-gray-400 hover:text-[#22C55E] transition-colors">
                      + Add more documents
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-16 text-center"
                data-ocid="documents.empty_state"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mb-4">
                  <FileText size={28} className="text-[#22C55E]" />
                </div>
                <p className="text-base font-semibold text-gray-700 mb-1">
                  No documents uploaded yet
                </p>
                <p className="text-sm text-gray-400 max-w-xs">
                  {isSuperAdmin
                    ? "Upload important building documents. Residents will be able to view them."
                    : "No documents have been uploaded yet. Check back later."}
                </p>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleFilePick}
                    className="mt-4 flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
                    data-ocid="documents.empty_upload_button"
                  >
                    <Upload size={15} />
                    Upload First Document
                  </button>
                )}
              </div>
            )}

            {/* Archived docs section */}
            {archivedDocs.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Archived ({archivedDocs.length})
                </p>
                <div className="space-y-2">
                  {archivedDocs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 opacity-60"
                      data-ocid={`documents.archived_item.${idx + 1}`}
                    >
                      <Archive
                        size={16}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
