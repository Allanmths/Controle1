import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/AuthPage';
import MainLayout from './pages/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import DashboardPage from './pages/DashboardPage';
import RegistersPage from './pages/RegistersPage';
import MovementsPage from './pages/MovementsPage';
import CountingPage from './pages/CountingPage';
import NewCountPage from './pages/NewCountPage';
import CountReportPage from './pages/CountReportPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditPage from './pages/AuditPage';

function App() {
  return (
    <>
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
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="registers" element={<RegistersPage />} />
            <Route path="movements" element={<MovementsPage />} />
            <Route path="counting" element={<CountingPage />} />
            <Route path="counting/new" element={<NewCountPage />} />
            <Route path="counting/:id" element={<CountReportPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
