import React, { useState } from 'react';
import CategoriesManager from '../components/CategoriesManager';
import LocationManager from '../components/LocationManager';
import ProductManager from '../components/ProductManager';
import ProductBulkImport from '../components/ProductBulkImport';
import { FaBox, FaTags, FaMapMarkerAlt, FaKeyboard } from 'react-icons/fa';

export default function RegistersPage() {
    const [activeTab, setActiveTab] = useState('produtos');

    const tabs = [
        { id: 'produtos', label: 'Produtos', icon: FaBox, shortcut: 'P' },
        { id: 'categorias', label: 'Categorias', icon: FaTags, shortcut: 'C' },
        { id: 'localidades', label: 'Localidades', icon: FaMapMarkerAlt, shortcut: 'L' }
    ];

    // Atalhos de teclado para navegação entre abas
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.altKey) {
                switch (event.key.toLowerCase()) {
                    case 'p':
                        event.preventDefault();
                        setActiveTab('produtos');
                        break;
                    case 'c':
                        event.preventDefault();
                        setActiveTab('categorias');
                        break;
                    case 'l':
                        event.preventDefault();
                        setActiveTab('localidades');
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'produtos':
                return (
                    <div className="space-y-8">
                        <ProductManager />
                        <ProductBulkImport />
                    </div>
                );
            case 'categorias':
                return <CategoriesManager />;
            case 'localidades':
                return <LocationManager />;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Cadastros</h2>
                
                {/* Indicador de atalhos */}
                <div className="hidden md:flex items-center text-sm text-gray-500 bg-white px-3 py-2 rounded-lg shadow-sm">
                    <FaKeyboard className="mr-2" />
                    <span>Alt + P/C/L para navegar</span>
                </div>
            </div>
            
            {/* Navegação por Abas Melhorada */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-0 md:space-x-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center py-4 px-4 md:px-6 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                    title={`Alt + ${tab.shortcut}`}
                                >
                                    <Icon className="mr-2 w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.shortcut}</span>
                                    <kbd className="hidden md:inline ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                        Alt+{tab.shortcut}
                                    </kbd>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Conteúdo da Aba Ativa com animação */}
            <div 
                className="transition-all duration-300 transform"
                data-tour="register-content"
            >
                {renderTabContent()}
            </div>
        </div>
    );
}
