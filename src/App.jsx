import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './context/NotificationContext';
import AuthPage from './pages/AuthPage';
import MainLayout from './pages/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import RegistersPage from './pages/RegistersPage';
import MovementsPage from './pages/MovementsPage';
import CountingPage from './pages/CountingPage';
import NewCountPage from './pages/NewCountPage';
import CountReportPage from './pages/CountReportPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditPage from './pages/AuditPage';
import ReplenishmentPage from './pages/ReplenishmentPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Controle1/sw.js', {
          scope: '/Controle1/'
        })
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return (
    <>
      <NotificationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: {
                background: '#28a745',
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#dc3545',
                color: 'white',
              },
            },
          }}
        />
        <Router basename="/Controle1">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="registers" element={<RegistersPage />} />
              <Route path="movements" element={<MovementsPage />} />
              <Route path="counting" element={<CountingPage />} />
              <Route path="counting/new" element={<NewCountPage />} />
              <Route path="counting/:id" element={<CountReportPage />} />
              <Route path="replenishment" element={<ReplenishmentPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit" element={<AuditPage />} />
            </Route>
          </Routes>
        </Router>
        <PWAInstallPrompt />
      </NotificationProvider>
    </>
  );
}

export default App;
