import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Home from './pages/Home';
import SearchPage from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddTrip from './pages/AddTrip';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Trust from './pages/Trust';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import KYC from './pages/KYC';

// Placeholder for other pages to be implemented
const UnderConstruction = ({ title }: { title: string }) => (
  <div className="pt-32 pb-24 px-6 text-center max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-slate-100 italic font-black text-slate-300">
      404
    </div>
    <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tighter uppercase italic">{title}</h1>
    <p className="text-slate-500 mb-12 font-bold max-w-md italic opacity-60">This feature is being developed for the next Bago mobile release.</p>
    <a href="/" className="btn-bold border-2 border-slate-100 hover:bg-slate-50 px-12 py-5 font-black">BACK TO BAGO</a>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans">
          <Navbar />
          <main className="flex-grow pb-24 md:pb-0">
            <Routes>
              {/* Public Landing */}
              <Route path="/" element={<Home />} />

              {/* Auth Required Routes */}
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/add-trip" element={<ProtectedRoute><AddTrip /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Auth + KYC Required Routes */}
              <Route path="/trust" element={<ProtectedRoute requireKyc><Trust /></ProtectedRoute>} />

              {/* Public Information */}
              <Route path="/how" element={<HowItWorks />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/support" element={<UnderConstruction title="Help & Support" />} />

              {/* Identity & Verification flow */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />

              {/* Fallback for anything not matched */}
              <Route path="*" element={<UnderConstruction title="404 - Not Found" />} />
            </Routes>
          </main>
          <Footer />
          <BottomNav />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
