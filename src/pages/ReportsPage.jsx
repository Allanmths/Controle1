import React, { useState } from 'react';
import { FaChartLine, FaFileAlt, FaBell, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import useFirestore from '../hooks/useFirestore';
import SkeletonLoader from '../components/SkeletonLoader';

// Componentes de Analytics
import AnalyticsDashboard from '../components/AnalyticsDashboard';

// Componentes de Relatórios
import StockValuationReport from '../components/reports/StockValuationReport';
import DeadStockReport from '../components/reports/DeadStockReport';
import StockReport from '../components/StockReport';

const ReportsPage = () => {
    const { userData } = useAuth();
    const [activeTab, setActiveTab] = useState('analytics');

    // Carregamento de dados para Analytics
    const { docs: products, loading: productsLoading, error: productsError } = useFirestore('products');
    const { docs: categories, loading: categoriesLoading, error: categoriesError } = useFirestore('categories');
    const { docs: movements, loading: movementsLoading, error: movementsError } = useFirestore('movements');

    const isLoading = productsLoading || categoriesLoading || movementsLoading;
    const hasError = productsError || categoriesError || movementsError;

    // Configuração das abas
    const tabs = {
        analytics: {
            name: 'Analytics Dashboard',
            icon: FaChartLine,
            component: (
                <AnalyticsDashboard 
                    products={products || []}
                    categories={categories || []}
                    movements={movements || []}
                    loading={isLoading}
                />
            )
        },
        stock: {
            name: 'Relatório de Estoque',
            icon: FaFileAlt,
            component: <StockReport />
        },
        valuation: {
            name: 'Valorização de Estoque',
            icon: FaFileAlt,
            component: <StockValuationReport />
        },
        dead_stock: {
            name: 'Estoque Obsoleto',
            icon: FaBell,
            component: <DeadStockReport />
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
                </div>
                <SkeletonLoader />
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                        Erro ao carregar dados
                    </h3>
                    <p className="text-red-600 dark:text-red-400">
                        {productsError?.message || categoriesError?.message || movementsError?.message}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    Analytics & Relatórios
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Análises avançadas e relatórios completos do seu estoque
                </p>
            </div>

            {/* Navegação por Abas */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {Object.entries(tabs).map(([key, tab]) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`${
                                    activeTab === key
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="min-h-[500px]">
                {tabs[activeTab].component}
            </div>
        </div>
    );
};

export default ReportsPage;
