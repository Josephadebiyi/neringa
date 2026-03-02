import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireKyc?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireKyc = false }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFDFF]">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="animate-spin text-brand-primary" size={64} />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Securing Session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login but save the current location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireKyc && user?.kycStatus !== 'Verified') {
        return <Navigate to="/kyc" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
