import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 mx-auto"></div>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Carregando...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Verificando sua sessão, por favor aguarde.</p>
                </div>
            </div>
        );
    }

    return currentUser ? children : <Navigate to="/auth" replace />;
};

export default PrivateRoute;
