import React, { useState } from 'react';
import StockTransferForm from '../components/StockTransferForm';
import StockExitForm from '../components/StockExitForm';

const MovementsPage = () => {
    const [activeTab, setActiveTab] = useState('forms');

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Movimentações de Estoque</h2>
            </div>

            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('forms')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'forms'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Formulários
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'history'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Histórico
                        </button>
                    </nav>
                </div>
            </div>

            {activeTab === 'forms' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StockTransferForm />
                    <StockExitForm />
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Histórico de Movimentações</h3>
                    <p className="text-gray-600">Histórico em desenvolvimento...</p>
                </div>
            )}
        </div>
    );
};

export default MovementsPage;