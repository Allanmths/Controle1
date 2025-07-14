import React from 'react';
import StockTransferForm from '../components/StockTransferForm';
import StockExitForm from '../components/StockExitForm';

const MovementsPage = () => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Movimentações de Estoque</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna de Transferência */}
                <StockTransferForm />

                {/* Coluna de Saída */}
                <StockExitForm />
            </div>
        </div>
    );
};

export default MovementsPage;
