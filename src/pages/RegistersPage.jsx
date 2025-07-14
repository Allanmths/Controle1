import React, { useState } from 'react';
import CategoriesManager from '../components/CategoriesManager';
import LocationManager from '../components/LocationManager';
import ProductManager from '../components/ProductManager';
import ProductBulkImport from '../components/ProductBulkImport';
import DiagnosticPanel from '../components/DiagnosticPanel';
import UserRoleManager from '../components/UserRoleManager';
import { FaBox, FaTags, FaMapMarkerAlt } from 'react-icons/fa';

export default function RegistersPage() {
    const [activeTab, setActiveTab] = useState('produtos');

    const tabs = [
        { id: 'produtos', label: 'Produtos', icon: FaBox },
        { id: 'categorias', label: 'Categorias', icon: FaTags },
        { id: 'localidades', label: 'Localidades', icon: FaMapMarkerAlt }
    ];

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
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Cadastros</h2>
            
            {/* Painel de Diagnóstico Temporário */}
            <DiagnosticPanel />
            
            {/* Gerenciador de Roles Temporário */}
            <UserRoleManager />
            
            {/* Navegação por Abas */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="mr-2" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="transition-opacity duration-200">
                {renderTabContent()}
            </div>
        </div>
    );
}
