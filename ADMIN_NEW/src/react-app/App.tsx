import { HashRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, DEFAULT_ADMIN_ROUTE } from "./hooks/useAuth";
import { AdminSocketProvider } from "./hooks/useAdminSocket";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const DashboardPage = lazy(() => import("./pages/Dashboard"));
const UsersPage = lazy(() => import("./pages/Users"));
const BusinessesPage = lazy(() => import("./pages/Businesses"));
const CreateBusinessPage = lazy(() => import("./pages/CreateBusiness"));
const TrackingPage = lazy(() => import("./pages/Tracking"));
const SupportPage = lazy(() => import("./pages/Support"));
const WithdrawalsPage = lazy(() => import("./pages/Withdrawals"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AnalyticsPage = lazy(() => import("./pages/Analytics"));
const StaffPage = lazy(() => import("./pages/Staff"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const EmailCampaignsPage = lazy(() => import("./pages/EmailCampaigns"));
const PricePerKgPage = lazy(() => import("./pages/priceperkg"));
const KYCVerificationManager = lazy(() => import("./pages/kyc"));
const PushNotificationPage = lazy(() => import("./pages/push-notification"));
const DisputesPage = lazy(() => import("./pages/disputes"));
const RefundsPage = lazy(() => import("./pages/Refund"));
const RoutesPage = lazy(() => import("./pages/Routes"));
const LocationsPage = lazy(() => import("./pages/Locations"));
const PromoEmailPage = lazy(() => import("./pages/PromoEmail"));
const TripsPage = lazy(() => import("./pages/Trips"));
const CreateTripPage = lazy(() => import("./pages/CreateTrip"));
const PromoCodesPage = lazy(() => import("./pages/PromoCodes"));
const OrdersPage = lazy(() => import("./pages/Orders"));
const BannersPage = lazy(() => import("./pages/Banners"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const ItemCategoriesPage = lazy(() => import("./pages/ItemCategories"));
const FlaggedUsersPage = lazy(() => import("./pages/FlaggedUsers"));
const InsurancePage = lazy(() => import("./pages/Insurance"));

export default function App() {
  return (
    <AuthProvider>
      <AdminSocketProvider>
      <Router>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F4F6FB] font-bold text-[#1e2749]">Loading admin page…</div>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TripsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/create"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateTripPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/promo-codes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PromoCodesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/promo-email"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PromoEmailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/businesses"
            element={<ProtectedRoute><DashboardLayout><BusinessesPage /></DashboardLayout></ProtectedRoute>}
          />
          <Route
            path="/businesses/create"
            element={<ProtectedRoute><DashboardLayout><CreateBusinessPage /></DashboardLayout></ProtectedRoute>}
          />
          <Route
            path="/tracking"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TrackingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SupportPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <OrdersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DisputesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/refund"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RefundsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <KYCVerificationManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/flagged-users"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FlaggedUsersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/priceperkg"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PricePerKgPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/push-notification"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PushNotificationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/banners"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BannersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/withdrawals"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WithdrawalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StaffPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NotificationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/emails"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EmailCampaignsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/routes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RoutesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LocationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/item-categories"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ItemCategoriesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/insurance"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InsurancePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={DEFAULT_ADMIN_ROUTE} replace />} />
        </Routes>
        </Suspense>
      </Router>
      </AdminSocketProvider>
    </AuthProvider>
  );
}
