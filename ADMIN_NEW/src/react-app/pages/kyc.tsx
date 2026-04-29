import React, { useEffect, useState } from "react";
import { User, Eye, Calendar, XCircle, Clock, ShieldCheck, FileText, Globe, Hash, RefreshCw } from "lucide-react";
import { getAllKyc, verifyKyc, runKycSweep } from "../services/api";

interface KycVerifiedData {
  fullName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  issuingCountry?: string;
  verificationStatus?: string;
}

interface UserData {
  isVerified: boolean;
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  kycStatus: string;
  country?: string;
  dateOfBirth: string;
  kycVerifiedAt?: string;
  kycVerifiedData?: KycVerifiedData;
  kycFailureReason?: string;
  profileImage?: string;
  diditSessionId?: string;
}

interface KYCItem {
  user: UserData;
}

export default function KYCVerificationManager() {
  const [kycItems, setKycItems] = useState<KYCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<{ approved: any[]; declined: any[]; unchanged: any[]; errors: any[] } | null>(null);
  const [previewKYC, setPreviewKYC] = useState<KYCItem | null>(null);

  useEffect(() => {
    fetchKYCData();
  }, []);

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const result = await getAllKyc();

      if (result.success && result.data && Array.isArray(result.data.users)) {
        setKycItems(result.data.users.map((user: UserData) => ({ user })));
      } else {
        setKycItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch KYC data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (userId: string, status: "declined") => {
    if (!confirm(`Are you sure you want to reject this KYC?`)) {
      return;
    }

    try {
      setProcessing(true);
      const result = await verifyKyc(userId, status);

      if (result.success) {
        await fetchKYCData();
        setPreviewKYC(null);
      } else {
        alert(result.message || "Failed to update verification status");
      }
    } catch (error: any) {
      console.error("Failed to verify KYC:", error);
      alert(error?.message || "An error occurred while updating verification status");
    } finally {
      setProcessing(false);
    }
  };

  const handleSweep = async () => {
    if (!confirm("Sync all pending KYC users with Didit? This will approve/decline based on Didit's current records.")) return;
    try {
      setSweeping(true);
      setSweepResult(null);
      const result = await runKycSweep();
      setSweepResult(result.results);
      await fetchKYCData();
      alert(`Sync complete: ${result.results.approved.length} approved, ${result.results.declined.length} declined, ${result.results.unchanged.length} unchanged, ${result.results.errors.length} errors.`);
    } catch (error: any) {
      alert(error?.message || "Sweep failed");
    } finally {
      setSweeping(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      approved: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      declined: "bg-red-100 text-red-700",
      failed_verification: "bg-red-100 text-red-700",
      blocked_duplicate: "bg-red-100 text-red-700",
    };

    const statusIcons: Record<string, React.ReactElement> = {
      approved: <ShieldCheck className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      declined: <XCircle className="w-4 h-4" />,
      failed_verification: <XCircle className="w-4 h-4" />,
      blocked_duplicate: <XCircle className="w-4 h-4" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
        {statusIcons[status]}
        <span className="capitalize">{(status ?? '').replaceAll("_", " ")}</span>
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KYC Verification Manager</h1>
          <p className="text-gray-600">Review identity verifications processed by Didit</p>
        </div>
        <button
          onClick={handleSweep}
          disabled={sweeping}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${sweeping ? 'animate-spin' : ''}`} />
          {sweeping ? "Syncing..." : "Sync with Didit"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{kycItems.length}</div>
          <div className="text-gray-600 text-sm">Total Submissions</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {kycItems.filter((item) => item.user.kycStatus === "approved").length}
          </div>
          <div className="text-gray-600 text-sm">Verified</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {kycItems.filter((item) => item.user.kycStatus === "pending").length}
          </div>
          <div className="text-gray-600 text-sm">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {kycItems.filter((item) => ["declined", "failed_verification", "blocked_duplicate"].includes(item.user.kycStatus)).length}
          </div>
          <div className="text-gray-600 text-sm">Rejected</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">KYC Submissions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kycItems.map((item) => (
            <div key={item.user._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="mb-3">
                {item.user.profileImage ? (
                  <img
                    src={item.user.profileImage}
                    alt={`${item.user.firstName} ${item.user.lastName}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <h3 className="font-medium text-gray-900 truncate" title={`${item.user.firstName} ${item.user.lastName}`}>
                    {item.user.firstName} {item.user.lastName}
                  </h3>
                  {getStatusBadge(item.user.kycStatus)}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <div className="truncate">{item.user.email}</div>
                  {item.user.kycVerifiedData?.fullName && item.user.kycVerifiedData.fullName !== `${item.user.firstName} ${item.user.lastName}` && (
                    <div className="text-xs text-blue-600 font-medium">Verified as: {item.user.kycVerifiedData.fullName}</div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>DOB: {formatDate(item.user.kycVerifiedData?.dateOfBirth || item.user.dateOfBirth)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setPreviewKYC(item)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Review</span>
                  </button>

                  {item.user.kycStatus === "pending" && (
                    <button
                      onClick={() => handleVerification(item.user._id, "declined")}
                      disabled={processing}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {kycItems.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No KYC submissions yet.</p>
          </div>
        )}
      </div>

      {previewKYC && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {previewKYC.user.firstName} {previewKYC.user.lastName}
                  </h2>
                  <p className="text-gray-600">{previewKYC.user.email}</p>
                  <div className="mt-2">
                    {getStatusBadge(previewKYC.user.kycStatus)}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewKYC(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Profile info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 text-gray-900">{previewKYC.user.phone || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Country:</span>
                    <span className="ml-2 text-gray-900">{previewKYC.user.country || "Not provided"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Date of Birth (profile):</span>
                    <span className="ml-2 text-gray-900">{formatDate(previewKYC.user.dateOfBirth)}</span>
                  </div>
                  {previewKYC.user.diditSessionId && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Didit Session:</span>
                      <span className="ml-2 text-gray-900 font-mono text-xs">{previewKYC.user.diditSessionId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Didit verified data */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Didit Verified Identity</h3>
                </div>
                {previewKYC.user.kycVerifiedData ? (
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-blue-500 font-medium uppercase tracking-wider">Full Name</div>
                        <div className="text-gray-900 font-semibold">{previewKYC.user.kycVerifiedData.fullName || "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-blue-500 font-medium uppercase tracking-wider">Date of Birth</div>
                        <div className="text-gray-900 font-semibold">{formatDate(previewKYC.user.kycVerifiedData.dateOfBirth)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Hash className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-blue-500 font-medium uppercase tracking-wider">Document Number</div>
                        <div className="text-gray-900 font-semibold font-mono">{previewKYC.user.kycVerifiedData.documentNumber || "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-blue-500 font-medium uppercase tracking-wider">Issuing Country</div>
                        <div className="text-gray-900 font-semibold">{previewKYC.user.kycVerifiedData.issuingCountry || "—"}</div>
                      </div>
                    </div>
                    {previewKYC.user.kycVerifiedAt && (
                      <div className="pt-2 border-t border-blue-100 text-xs text-blue-600">
                        Verified at: {formatDate(previewKYC.user.kycVerifiedAt)}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No verified data yet. Verification may be pending or incomplete.</p>
                )}
              </div>

              {/* Failure reason if any */}
              {previewKYC.user.kycFailureReason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-1 text-sm">Failure Reason</h3>
                  <p className="text-sm text-red-700">{previewKYC.user.kycFailureReason}</p>
                </div>
              )}

              <div className="flex gap-3">
                {previewKYC.user.kycStatus === "pending" && (
                  <button
                    onClick={() => handleSweep()}
                    disabled={processing}
                    className="bg-[#5845D8] hover:bg-[#4937c6] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} />
                    <span>{processing ? "Syncing..." : "Sync from Didit"}</span>
                  </button>
                )}
                {previewKYC.user.kycStatus === "pending" && (
                  <button
                    onClick={() => handleVerification(previewKYC.user._id, "declined")}
                    disabled={processing}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{processing ? "Processing..." : "Reject KYC"}</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewKYC(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
