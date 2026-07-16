import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config/googleAuth';

const Signup = lazy(() => import('./pages/Signup'));
const SignupTest = lazy(() => import('./pages/SignupTest'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Search = lazy(() => import('./pages/Search'));
const PostTrip = lazy(() => import('./pages/PostTrip'));
const SendPackage = lazy(() => import('./pages/SendPackage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const HowToUse = lazy(() => import('./pages/HowToUse'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const TrackShipment = lazy(() => import('./pages/TrackShipment'));
const Banned = lazy(() => import('./pages/Banned'));
const Verify = lazy(() => import('./pages/Verify'));
const Support = lazy(() => import('./pages/Support'));
const ShippingSuccess = lazy(() => import('./pages/ShippingSuccess'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const PaymentCheckout = lazy(() => import('./pages/PaymentCheckout'));
const Test = lazy(() => import('./Test'));

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LanguageProvider>
                <BrowserRouter>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8F6F3] text-[#5845D8] font-bold">Loading Bago…</div>}>
                    <Routes>
                        <Route path="/test" element={<Test />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/how-it-works" element={<HowToUse />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/help" element={<HelpCenter />} />
                        <Route path="/track" element={<TrackShipment />} />
                        <Route path="/banned" element={<Banned />} />
                        <Route path="/signup-test" element={<SignupTest />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/post-trip" element={<PostTrip />} />
                        <Route path="/send-package" element={<SendPackage />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/verify-otp" element={<VerifyOtp />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/shipping-success" element={<ShippingSuccess />} />
                        <Route path="/payment/callback" element={<PaymentCallback />} />
                        <Route path="/checkout/payment" element={<PaymentCheckout />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </Suspense>
                </BrowserRouter>
            </LanguageProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
