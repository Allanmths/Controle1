import React, { useState } from 'react';
import StockValuationReport from '../components/reports/StockValuationReport';
import ABCAnalysisReport from '../components/reports/ABCAnalysisReport';
import DeadStockReport from '../components/reports/DeadStockReport';
import StockReport from '../components/StockReport';

const reports = {
    valuation: {
        name: 'Valorização de Estoque',
        component: <StockValuationReport />
    },
    abc: {
        name: 'Curva ABC',
        component: <ABCAnalysisReport />
    },
    dead_stock: {
        name: 'Estoque Obsoleto',
        component: <DeadStockReport />
    },
    stock: {
        name: 'Relatório de Estoque',
        component: <StockReport />
    },
    // Outros relatórios serão adicionados aqui (ex: abc, dead_stock)
};

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('valuation');

    const ActiveComponent = reports[activeTab].component;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Central de Relatórios</h2>

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {Object.entries(reports).map(([key, report]) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`${
                                activeTab === key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            {report.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {ActiveComponent}
            </div>
        </div>
    );
};

export default ReportsPage;
