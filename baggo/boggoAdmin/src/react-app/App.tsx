import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Login from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import TrackingPage from "./pages/Tracking";
import SupportPage from "./pages/Support";
import WithdrawalsPage from "./pages/Withdrawals";
import SettingsPage from "./pages/Settings";
import AnalyticsPage from "./pages/Analytics";
import StaffPage from "./pages/Staff";
import NotificationsPage from "./pages/Notifications";
import EmailCampaignsPage from "./pages/EmailCampaigns";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PricePerKgPage from "./pages/priceperkg";
import KYCVerificationManager from "./pages/kyc"
import PushNotificationPage from "./pages/push-notification"
import DisputesPage from "./pages/disputes"
import RefundsPage from "./pages/Refund"
import RoutesPage from "./pages/Routes"
import LocationsPage from "./pages/Locations"
import PromoEmailPage from "./pages/PromoEmail"
import TripsPage from "./pages/Trips"
import PromoCodesPage from "./pages/PromoCodes"

export default function App() {
  return (
    <AuthProvider>
      <Router>
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
                  <TrackingPage />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}
