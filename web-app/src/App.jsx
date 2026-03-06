import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupTest from './pages/SignupTest';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import PostTrip from './pages/PostTrip';
import SendPackage from './pages/SendPackage';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AboutUs from './pages/AboutUs';
import HowToUse from './pages/HowToUse';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import HelpCenter from './pages/HelpCenter';
import TrackShipment from './pages/TrackShipment';

const GOOGLE_CLIENT_ID = "207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com";

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LanguageProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/how-it-works" element={<HowToUse />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/help" element={<HelpCenter />} />
                        <Route path="/track" element={<TrackShipment />} />
                        <Route path="/signup-test" element={<SignupTest />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/post-trip" element={<PostTrip />} />
                        <Route path="/send-package" element={<SendPackage />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/verify-otp" element={<VerifyOtp />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                    </Routes>
                </BrowserRouter>
            </LanguageProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
