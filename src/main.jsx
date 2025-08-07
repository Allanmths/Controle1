import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import PWAUpdater from './components/PWAUpdater';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <PWAUpdater />
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </SettingsProvider>
  </React.StrictMode>
);
