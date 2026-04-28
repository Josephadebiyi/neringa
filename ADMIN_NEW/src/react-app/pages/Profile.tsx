import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Eye, EyeOff, Loader2, Save, User } from "lucide-react";
import { getAdminProfile, updateAdminProfile } from "../services/api";
import { useAuth } from "../hooks/useAuth";

interface AdminProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  profileImage?: string;
}

interface Toast { id: string; msg: string; ok: boolean; }

export default function Profile() {
  const { user } = useAuth();
  const [profile,   setProfile]   = useState<AdminProfile | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toasts,    setToasts]    = useState<Toast[]>([]);
  const [preview,   setPreview]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [fullName,   setFullName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [username,   setUsername]   = useState("");
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);

  const push = (msg: string, ok = true) => {
    const id = `${Date.now()}`;
    setToasts(p => [...p, { id, msg, ok }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const d = await getAdminProfile();
        if (d.success) {
          setProfile(d.data);
          setFullName(d.data.fullName || "");
          setEmail(d.data.email || "");
          setUsername(d.data.username || "");
        }
      } catch { push("Failed to load profile.", false); }
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

  const saveProfile = async () => {
    if (newPw && newPw !== confirmPw) { push("New passwords do not match.", false); return; }
    if (newPw && newPw.length < 8)   { push("New password must be at least 8 characters.", false); return; }

    const fd = new FormData();
    if (fullName !== profile?.fullName) fd.append("fullName", fullName);
    if (email    !== profile?.email)    fd.append("email", email);
    if (username !== profile?.username) fd.append("username", username);
    if (newPw)    { fd.append("newPassword", newPw); fd.append("currentPassword", currentPw); }
    else if (currentPw && (email !== profile?.email || username !== profile?.username)) {
      fd.append("currentPassword", currentPw);
    }
    if (fileRef.current?.files?.[0]) fd.append("profileImage", fileRef.current.files[0]);

    // Nothing changed
    if ([...fd.entries()].length === 0) { push("No changes to save."); return; }

    try {
      setSaving(true);
      const d = await updateAdminProfile(fd);
      if (d.success) {
        setProfile(d.data);
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        push("Profile updated successfully.");
      }
    } catch (e: any) {
      push(e.message || "Failed to update profile.", false);
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = preview || profile?.profileImage;
  const initials  = (profile?.fullName || profile?.username || user?.username || "A")[0]?.toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your name, email, profile picture, and login credentials.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="relative">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Profile" className="h-20 w-20 rounded-full object-cover ring-2 ring-indigo-100" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white ring-2 ring-indigo-100">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{profile?.fullName || profile?.username}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-indigo-500">{profile?.role}</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Camera className="h-4 w-4" />
          Change photo
        </button>
      </div>

      {/* Basic info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-gray-900">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-gray-400">Changing email requires your current password.</p>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Change Password</h2>
        <p className="mb-5 text-xs text-gray-400">Leave blank to keep your current password.</p>
        <div className="space-y-4">
          <PwField label="Current Password" value={currentPw} onChange={setCurrentPw} show={showCur} toggle={() => setShowCur(p => !p)} placeholder="Enter current password" />
          <PwField label="New Password"     value={newPw}     onChange={setNewPw}     show={showNew} toggle={() => setShowNew(p => !p)} placeholder="Min 8 characters" />
          <PwField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showCon} toggle={() => setShowCon(p => !p)} placeholder="Repeat new password"
            error={confirmPw && newPw && confirmPw !== newPw ? "Passwords do not match" : undefined} />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function PwField({ label, value, onChange, show, toggle, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; toggle: () => void; placeholder: string; error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none focus:ring-1 ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"}`}
        />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
