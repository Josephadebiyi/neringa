
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './AuthContext.jsx';

try {
    const root = document.getElementById('root');

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <AuthProvider>
                <App />
            </AuthProvider>
        </React.StrictMode>,
    );
} catch (error) {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial';
    container.style.background = '#fee';
    container.style.color = '#c00';

    const title = document.createElement('h1');
    title.textContent = 'React Rendering Error';

    const pre = document.createElement('pre');
    pre.textContent = `${error.message}\n${error.stack}`;

    container.appendChild(title);
    container.appendChild(pre);
    document.body.appendChild(container);
}
