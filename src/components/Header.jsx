import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaWineBottle } from 'react-icons/fa';


export default function Header({ onMenuClick }) {
    const { currentUser } = useAuth();

    const userRole = currentUser?.role || 'Administrador';

    return (
        <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between lg:justify-center relative">
                {/* Hamburger Menu - visible only on small screens */}
                <button 
                    onClick={onMenuClick} 
                    className="p-2 rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
                    aria-label="Abrir menu"
                >
                    <FaBars className="h-6 w-6" />
                </button>

                {/* Logo and Title - centered */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="flex items-center">
                        <FaWineBottle className="h-8 w-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-slate-800">Estoque HCM</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Bem-vindo! Você está logado como {userRole}.
                    </p>
                </div>

                {/* This div is a placeholder to balance the flex layout on mobile */}
                <div className="w-8 lg:hidden"></div>
            </div>
        </header>
    );
}
