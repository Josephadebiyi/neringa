import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './AuthContext.jsx'

console.log('🚀 React app starting...');

try {
    const root = document.getElementById('root');
    console.log('✅ Root element found:', root);

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <AuthProvider>
                <App />
            </AuthProvider>
        </React.StrictMode>,
    );

    console.log('✅ React app rendered successfully!');
} catch (error) {
    console.error('❌ React app failed to render:', error);
    document.body.innerHTML = `
        <div style="padding: 40px; font-family: Arial; background: #fee; color: #c00;">
            <h1>❌ React Rendering Error</h1>
            <pre>${error.message}\n${error.stack}</pre>
        </div>
    `;
}
