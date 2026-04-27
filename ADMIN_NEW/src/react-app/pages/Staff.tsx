import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Headset,
  KeyRound,
  Loader2,
  Mail,
  PencilLine,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { BAGO_BRAND, STAFF_PERMISSION_PRESETS } from "../config/brand";
import { createStaff, deleteStaff, getStaff, updateStaff } from "../services/api";

interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  userName: string;
  role: "SUPER_ADMIN" | "SAFETY_ADMIN" | "SUPPORT_ADMIN";
  isActive: boolean;
  createdAt: string;
}

type RoleId = StaffMember["role"];

const roleConfig: {
  id: RoleId;
  name: string;
  icon: typeof Shield;
  iconWrap: string;
  badge: string;
  description: string;
  preview: string[];
}[] = [
  {
    id: "SUPPORT_ADMIN",
    name: "Support Admin",
    icon: Headset,
    iconWrap: "bg-[#EEF2FF] text-[#5240E8]",
    badge: "bg-[#EEF2FF] text-[#5240E8]",
    description: "Owns inbox replies, ticket updates, and customer support operations.",
    preview: ["Answer live conversations", "Update ticket status", "Coordinate shipment help"],
  },
  {
    id: "SAFETY_ADMIN",
    name: "Safety Admin",
    icon: ShieldAlert,
    iconWrap: "bg-[#FFF4E8] text-[#C66A1C]",
    badge: "bg-[#FFF4E8] text-[#C66A1C]",
    description: "Handles disputes, verification issues, trust escalations, and policy review.",
    preview: ["Handle compliance escalations", "Review risky cases", "Support dispute resolution"],
  },
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    icon: ShieldCheck,
    iconWrap: "bg-[#FFF0F0] text-[#C73737]",
    badge: "bg-[#FFF0F0] text-[#C73737]",
    description: "Controls team setup, system-wide changes, and high-trust administrative actions.",
    preview: ["Manage staff access", "Oversee all queues", "Control sensitive settings"],
  },
];

function roleMeta(role: RoleId) {
  return roleConfig.find((item) => item.id === role) ?? roleConfig[0];
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    userName: "",
    password: "",
    role: "SUPPORT_ADMIN" as RoleId,
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaff();
      if (data.success) {
        setStaff(data.data);
      }
    } catch (fetchError) {
      console.error("Failed to fetch staff:", fetchError);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      userName: "",
      password: "",
      role: "SUPPORT_ADMIN",
    });
    setEditingStaff(null);
    setShowModal(false);
    setError(null);
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      fullName: member.fullName,
      email: member.email,
      userName: member.userName,
      password: "",
      role: member.role,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const [firstName, ...rest] = formData.fullName.trim().split(/\s+/);
      const lastName = rest.join(" ");
      const payload = {
        ...formData,
        first_name: firstName || formData.fullName.trim(),
        last_name: lastName,
        permissions: [...STAFF_PERMISSION_PRESETS[formData.role]],
      };
      let data;
      if (editingStaff) {
        data = await updateStaff(editingStaff._id, payload);
      } else {
        data = await createStaff(payload);
      }

      if (data.success) {
        await fetchStaff();
        resetForm();
      } else {
        setError(data.message || `Failed to ${editingStaff ? "update" : "create"} team member`);
      }
    } catch (submitError) {
      setError("Network error occurred while saving the teammate.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this teammate?")) return;
    try {
      const data = await deleteStaff(id);
      if (data.success) {
        fetchStaff();
      }
    } catch (deleteError) {
      console.error("Failed to delete staff:", deleteError);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const haystack = [member.email, member.fullName, member.userName, member.role].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const activeSupportAdmins = staff.filter((member) => member.role === "SUPPORT_ADMIN" && member.isActive).length;
  const activeSafetyAdmins = staff.filter((member) => member.role === "SAFETY_ADMIN" && member.isActive).length;
  const activeSuperAdmins = staff.filter((member) => member.role === "SUPER_ADMIN" && member.isActive).length;
  const activeTotal = staff.filter((member) => member.isActive).length;
  const selectedRole = roleMeta(formData.role);
  const SelectedRoleIcon = selectedRole.icon;

  return (
    <div className="min-h-[calc(100vh-160px)] rounded-[36px] bg-[radial-gradient(circle_at_top_right,_rgba(82,64,232,0.12),_transparent_32%),linear-gradient(180deg,#fbfbff_0%,#f4f6fb_100%)] p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-[#5240E8] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Teammate provisioning
          </div>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={BAGO_BRAND.logoUrl}
              alt={BAGO_BRAND.name}
              className="h-11 w-11 rounded-2xl bg-white p-1.5 shadow-sm"
            />
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#98A2B3]">
              Bago operator team
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#1e2749] md:text-4xl">Support team workspace</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#667085]">
            Build the operator team like a real support desk. Roles, access, and onboarding context
            should feel intentional, not like raw admin CRUD.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#5240E8] px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(82,64,232,0.25)] transition hover:scale-[1.02] active:scale-95"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Add teammate
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Users} label="Active teammates" value={activeTotal} accent="bg-[#EEF2FF] text-[#5240E8]" />
        <SummaryCard icon={Headset} label="Support admins" value={activeSupportAdmins} accent="bg-[#EEF2FF] text-[#5240E8]" />
        <SummaryCard icon={ShieldAlert} label="Safety admins" value={activeSafetyAdmins} accent="bg-[#FFF4E8] text-[#C66A1C]" />
        <SummaryCard icon={ShieldCheck} label="Super admins" value={activeSuperAdmins} accent="bg-[#FFF0F0] text-[#C73737]" />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        {roleConfig.map((role) => {
          const Icon = role.icon;
          const activeCount = staff.filter((member) => member.role === role.id && member.isActive).length;
          return (
            <div
              key={role.id}
              className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(30,39,73,0.06)]"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-2xl p-3 ${role.iconWrap}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1e2749]">{role.name}</h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">{role.description}</p>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
                    {activeCount} active seats
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_18px_60px_rgba(30,39,73,0.08)]">
          <div className="border-b border-[#EEF0F5] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1e2749]">Teammates</h2>
                <p className="text-sm font-medium text-[#98A2B3]">
                  Search, review, and manage who has access to the support operation.
                </p>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type="text"
                  placeholder="Search by name, email, username, or role"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-2xl border border-[#E7EAF0] bg-[#F9FAFB] py-3 pl-11 pr-4 text-sm font-medium text-[#1e2749] outline-none transition focus:border-[#C9CCFF] focus:bg-white focus:ring-4 focus:ring-[#5240E8]/10"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-24">
              <Loader2 className="h-9 w-9 animate-spin text-[#5240E8]" />
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
                Loading teammate seats
              </p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="px-8 py-24 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F4F5F7]">
                <Users className="h-7 w-7 text-[#98A2B3]" />
              </div>
              <h3 className="text-base font-black text-[#1e2749]">No teammates match that search</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-[#98A2B3]">
                Clear the search or add a new support teammate to start building the operator roster.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F2F4F7]">
              {filteredStaff.map((member) => {
                const meta = roleMeta(member.role);
                const Icon = meta.icon;
                return (
                  <div
                    key={member._id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[#FAFBFF] lg:flex-row lg:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] text-sm font-black ${
                          member.role === "SUPER_ADMIN"
                            ? "bg-[#FFF0F0] text-[#C73737]"
                            : member.role === "SAFETY_ADMIN"
                              ? "bg-[#FFF4E8] text-[#C66A1C]"
                              : "bg-[#EEF2FF] text-[#5240E8]"
                        }`}
                      >
                        {(member.fullName || member.userName || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-[#1e2749]">{member.fullName}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${meta.badge}`}
                          >
                            {member.role.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#667085]">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {member.email}
                          </span>
                          <span>@{member.userName}</span>
                          <span>Added {new Date(member.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-2.5 w-2.5 rounded-full ${
                            member.isActive ? "bg-[#12B76A]" : "bg-[#D0D5DD]"
                          }`}
                        />
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#D8DCE5] bg-white px-3 py-2 text-xs font-black text-[#344054] transition hover:border-[#B9C0FF] hover:text-[#5240E8]"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member._id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#F3D8D8] bg-[#FFF6F6] px-3 py-2 text-xs font-black text-[#C73737] transition hover:bg-[#FFF0F0]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(30,39,73,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
              Provisioning notes
            </p>
            <div className="mt-4 space-y-3">
              <AsideNote
                icon={Headset}
                title="Start with support-first seats"
                description="Support admins should be the default so the team can reply fast without overexposing system settings."
              />
              <AsideNote
                icon={Shield}
                title="Grant trust deliberately"
                description="Escalate to safety or super admin only when the teammate needs policy or platform-wide controls."
              />
              <AsideNote
                icon={CheckCircle2}
                title="Keep roles easy to explain"
                description="A teammate should understand their permissions from the role name alone, the way Intercom teammates do."
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(30,39,73,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
              Role quick view
            </p>
            <div className="mt-4 space-y-3">
              {roleConfig.map((role) => {
                const Icon = role.icon;
                return (
                  <div key={role.id} className="rounded-2xl bg-[#F8F9FC] p-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-2xl p-2.5 ${role.iconWrap}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1e2749]">{role.name}</p>
                        <p className="text-xs font-medium text-[#667085]">{role.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/45 p-4 backdrop-blur-sm">
          <div className="grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(11,16,32,0.25)] lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_100%)] p-6 md:p-8">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
                    {editingStaff ? "Update teammate" : "Add teammate"}
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-[#1e2749]">
                    {editingStaff ? "Edit support team seat" : "Provision a new support teammate"}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#667085]">
                    Treat team creation like operator onboarding. Make the role clear, choose the
                    right access level, and keep the setup lightweight enough for fast staffing.
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="rounded-2xl border border-[#E7EAF0] bg-white p-2.5 text-[#98A2B3] transition hover:text-[#344054]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#F7D6D6] bg-[#FFF5F5] px-4 py-3 text-sm font-bold text-[#B42318]">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Full name"
                    placeholder="e.g. Jane Carter"
                    value={formData.fullName}
                    onChange={(value) => setFormData({ ...formData, fullName: value })}
                  />
                  <Field
                    label="Username"
                    placeholder="janecarter"
                    value={formData.userName}
                    onChange={(value) => setFormData({ ...formData, userName: value })}
                  />
                </div>

                <Field
                  label="Email address"
                  type="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(value) => setFormData({ ...formData, email: value })}
                />

                <div>
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
                    Team role
                  </label>
                  <div className="grid gap-3">
                    {roleConfig.map((role) => {
                      const Icon = role.icon;
                      const selected = formData.role === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: role.id })}
                          className={`rounded-[24px] border px-4 py-4 text-left transition ${
                            selected
                              ? "border-[#C8CBFF] bg-[#F5F4FF] shadow-[0_12px_30px_rgba(82,64,232,0.08)]"
                              : "border-[#E7EAF0] bg-white hover:border-[#D8DCF5]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`rounded-2xl p-2.5 ${role.iconWrap}`}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-[#1e2749]">{role.name}</p>
                                {selected && (
                                  <span className="rounded-full bg-[#5240E8] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">{role.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
                    Password {editingStaff ? "(optional while editing)" : ""}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required={!editingStaff}
                      value={formData.password}
                      onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                      className="w-full rounded-[22px] border border-[#E7EAF0] bg-[#F9FAFB] px-4 py-3 pr-12 text-sm font-medium text-[#1e2749] outline-none transition focus:border-[#C9CCFF] focus:bg-white focus:ring-4 focus:ring-[#5240E8]/10"
                      placeholder="Create a secure password"
                    />
                    <KeyRound className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#D8DCE5] bg-white px-5 py-3 text-sm font-black text-[#344054] transition hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-[#5240E8] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(82,64,232,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving teammate...
                      </>
                    ) : editingStaff ? (
                      "Save changes"
                    ) : (
                      "Provision teammate"
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="border-l border-[#EEF0F5] bg-[linear-gradient(180deg,#f6f5ff_0%,#eef3ff_100%)] p-6 md:p-8">
              <div className="rounded-[28px] bg-white/80 p-5 shadow-[0_18px_60px_rgba(30,39,73,0.08)]">
                <div className={`inline-flex rounded-2xl p-3 ${selectedRole.iconWrap}`}>
                  <SelectedRoleIcon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-xl font-black text-[#1e2749]">{selectedRole.name}</h4>
                <p className="mt-2 text-sm font-medium leading-6 text-[#667085]">
                  {selectedRole.description}
                </p>

                <div className="mt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
                    What this teammate can focus on
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRole.preview.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white bg-white px-3 py-1.5 text-[11px] font-bold text-[#344054]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-[#F8F9FC] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#98A2B3]">
                    Permission preset
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STAFF_PERMISSION_PRESETS[formData.role].map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full border border-white bg-white px-3 py-1.5 text-[11px] font-bold text-[#344054]"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <ProvisioningHint
                  icon={Mail}
                  title="Make ownership obvious"
                  description="Use a clear work email and recognizable name so support conversations feel human on the admin side too."
                />
                <ProvisioningHint
                  icon={Shield}
                  title="Choose the narrowest useful role"
                  description="Start with support admin for conversation handling. Promote access only when workflows require it."
                />
                <ProvisioningHint
                  icon={CheckCircle2}
                  title="Think in seats, not raw users"
                  description="This flow should feel like giving someone a seat on the support desk, which is the same mental model Intercom uses."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_12px_40px_rgba(30,39,73,0.06)]">
      <div className={`inline-flex rounded-2xl p-2.5 ${accent}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-4 text-2xl font-black text-[#1e2749]">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">{label}</p>
    </div>
  );
}

function AsideNote({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#EEF0F5] bg-[#FCFCFD] p-4">
      <div className="mb-3 inline-flex rounded-2xl bg-[#EEF2FF] p-2 text-[#5240E8]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-black text-[#1e2749]">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">{description}</p>
    </div>
  );
}

function ProvisioningHint({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Mail;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/75 p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-2xl bg-[#EEF2FF] p-2 text-[#5240E8]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-black text-[#1e2749]">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-[#98A2B3]">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[22px] border border-[#E7EAF0] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#1e2749] outline-none transition focus:border-[#C9CCFF] focus:bg-white focus:ring-4 focus:ring-[#5240E8]/10"
      />
    </div>
  );
}
