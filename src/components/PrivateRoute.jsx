import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Carregando...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Verificando sua sessão.</p>
                </div>
            </div>
        );
    }

    return currentUser ? children : <Navigate to="/auth" />;
}
