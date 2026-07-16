
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './AuthContext.jsx';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#F8F7FF] p-8 text-center">
                <div className="max-w-sm">
                    <h1 className="text-2xl font-black text-[#111827] mb-3">Bago could not load</h1>
                    <p className="text-gray-500 mb-6">Please reload to reconnect to the latest version.</p>
                    <button onClick={() => window.location.reload()} className="bg-[#5845D8] text-white font-bold px-6 py-3 rounded-xl">Reload Bago</button>
                </div>
            </main>
        );
    }
}

window.__BAGO_WEB_BUILD__ = '2026-07-09-google-auth-1';

if (typeof document !== 'undefined') {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    document.addEventListener('gesturestart', (event) => {
        event.preventDefault();
    });
}

try {
    const root = document.getElementById('root');

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <AppErrorBoundary>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </AppErrorBoundary>
        </React.StrictMode>,
    );
} catch (error) {
    console.error('React rendering error:', error);
    document.body.innerHTML = '';
    const container = document.createElement('div');
    container.style.minHeight = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.gap = '16px';
    container.style.padding = '32px';
    container.style.fontFamily = 'Inter, Arial, sans-serif';
    container.style.background = '#f8f7ff';
    container.style.color = '#111827';
    container.style.textAlign = 'center';

    const title = document.createElement('h1');
    title.textContent = 'Something went wrong';
    title.style.margin = '0';
    title.style.fontSize = '28px';
    title.style.fontWeight = '800';

    const message = document.createElement('p');
    message.textContent = 'Please refresh the page or try again in a moment.';
    message.style.margin = '0';
    message.style.maxWidth = '360px';
    message.style.color = '#6b7280';

    const button = document.createElement('button');
    button.textContent = 'Refresh';
    button.style.border = '0';
    button.style.borderRadius = '14px';
    button.style.padding = '12px 22px';
    button.style.background = '#5845D8';
    button.style.color = '#ffffff';
    button.style.fontWeight = '700';
    button.style.cursor = 'pointer';
    button.onclick = () => window.location.reload();

    container.appendChild(title);
    container.appendChild(message);
    container.appendChild(button);
    document.body.appendChild(container);
}
