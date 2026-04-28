import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Image, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { createBanner, deleteBanner, getBanners, toggleBanner } from "../services/api";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Toast { id: string; msg: string; ok: boolean; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (msg: string, ok = true) => {
    const id = `${Date.now()}`;
    setToasts(p => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  return { toasts, push };
}

export default function Banners() {
  const [banners, setBanners]   = useState<Banner[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);
  const [title, setTitle]       = useState("");
  const [linkUrl, setLinkUrl]   = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toasts, push } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await getBanners();
        if (d.success) setBanners(d.data);
      } catch { push("Failed to load banners.", false); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { push("Please select an image file.", false); return; }
    if (file.size > 5 * 1024 * 1024) { push("Image must be under 5 MB.", false); return; }
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setTitle(""); setLinkUrl(""); setSortOrder("0");
    setPreview(null); setShowForm(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!title.trim()) { push("Title is required.", false); return; }
    if (!fileRef.current?.files?.[0] && !preview) { push("Please select an image.", false); return; }

    const fd = new FormData();
    fd.append("title", title.trim());
    if (linkUrl.trim()) fd.append("linkUrl", linkUrl.trim());
    fd.append("sortOrder", sortOrder);
    if (fileRef.current?.files?.[0]) fd.append("image", fileRef.current.files[0]);

    try {
      setSubmitting(true);
      const d = await createBanner(fd);
      if (d.success) {
        setBanners(p => [d.data, ...p]);
        push("Banner created.");
        reset();
      }
    } catch (e: any) {
      push(e.message || "Failed to create banner.", false);
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (id: string) => {
    try {
      const d = await toggleBanner(id);
      if (d.success) setBanners(p => p.map(b => b.id === id ? { ...b, isActive: d.data.isActive } : b));
    } catch { push("Failed to update.", false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteBanner(id);
      setBanners(p => p.filter(b => b.id !== id));
      push("Banner deleted.");
    } catch { push("Failed to delete.", false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-lg ${t.ok ? "border-gray-200 bg-white text-gray-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {t.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Banners</h1>
          <p className="mt-1 text-sm text-gray-500">Banners display in the app's home screen carousel for users.</p>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      {/* Size guide */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="mb-1 text-sm font-semibold text-blue-800">Image Size Guidelines</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-blue-700 sm:grid-cols-4">
          <span>• Recommended: <strong>1200 × 400 px</strong></span>
          <span>• Aspect ratio: <strong>3:1</strong></span>
          <span>• Format: <strong>JPG or PNG</strong></span>
          <span>• Max size: <strong>5 MB</strong></span>
        </div>
        <p className="mt-2 text-xs text-blue-600">Banners that don't match the 3:1 ratio will be cropped or letterboxed on smaller screens.</p>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">New Banner</h2>
            <button onClick={reset} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Left: fields */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Summer Sale — 20% off"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Link URL <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-gray-400">Where to send users when they tap the banner.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Sort Order <span className="font-normal text-gray-400">(0 = first)</span></label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  min={0}
                  className="w-32 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Right: image upload */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Banner Image *</label>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
              >
                {preview ? (
                  <>
                    <img src={preview} alt="preview" className="h-full max-h-[160px] w-full rounded-lg object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                      <p className="text-sm font-semibold text-white">Click to change</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Drop image here or click to browse</p>
                    <p className="mt-1 text-xs text-gray-400">1200 × 400 px recommended · JPG or PNG · max 5 MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button onClick={reset} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {submitting ? "Uploading…" : "Create Banner"}
            </button>
          </div>
        </div>
      )}

      {/* Banner list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20">
          <Image className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No banners yet</p>
          <p className="mt-1 text-xs text-gray-400">Click "Add Banner" to create your first promotional banner.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {banners.map(banner => (
            <div key={banner.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${banner.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              {/* Banner image */}
              <div className="relative aspect-[3/1] w-full overflow-hidden bg-gray-100">
                <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                <div className="absolute right-2 top-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow ${banner.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                    {banner.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{banner.title}</p>
                    {banner.linkUrl && (
                      <p className="mt-0.5 truncate text-xs text-indigo-500">{banner.linkUrl}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      Order: {banner.sortOrder} · Added {new Date(banner.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => toggle(banner.id)}
                      title={banner.isActive ? "Hide banner" : "Show banner"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => remove(banner.id)}
                      title="Delete banner"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
