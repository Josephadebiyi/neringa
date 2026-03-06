import React from 'react';
import { Link } from 'react-router-dom';

export default function SignupTest() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                <h1 className="text-3xl font-bold text-[#012126] mb-4">Signup Test Page</h1>
                <p className="text-gray-600 mb-4">If you can see this, React is working fine.</p>
                <Link to="/" className="text-[#5845D8] hover:underline">Go to Home</Link>
            </div>
        </div>
    );
}
