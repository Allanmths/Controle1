import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaWineBottle } from 'react-icons/fa';
import GlobalSearch from './GlobalSearch';
import NotificationCenter from './NotificationCenter';


export default function Header({ onMenuClick }) {
    const { currentUser } = useAuth();

    const userRole = currentUser?.role || 'Administrador';

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Left Side - Hamburger Menu */}
                <div className="flex items-center">
                    <button 
                        onClick={onMenuClick} 
                        className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
                        aria-label="Abrir menu"
                    >
                        <FaBars className="h-6 w-6" />
                    </button>
                </div>

                {/* Center - Logo and Title */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center">
                        <FaWineBottle className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Estoque HCM</h1>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Bem-vindo! VocÃª estÃ¡ logado como {userRole}.
                    </p>
                </div>

                {/* Right Side - Search and Notifications */}
                <div className="flex items-center space-x-3">
                    <GlobalSearch />
                    <NotificationCenter />
                </div>
            </div>
        </header>
    );
}
