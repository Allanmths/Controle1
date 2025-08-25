import React, { useState } from 'react';
import { FaRobot, FaHandPaper, FaClipboardList } from 'react-icons/fa';
import SmartPurchaseListDashboard_OLD from './SmartPurchaseListDashboard_OLD';
import ManualPurchaseListDashboard from './ManualPurchaseListDashboard';

export const SmartPurchaseListDashboard = () => {
  const [activeMode, setActiveMode] = useState('automatic');

  return (
    <div className="space-y-6">
      {/* Cabeçalho com abas */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveMode('automatic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'automatic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaRobot />
                <span>Lista Automática</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveMode('manual')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeMode === 'manual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaHandPaper />
                <span>Lista Manual</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Descrição do modo atual */}
        <div className="px-6 py-4 bg-gray-50">
          {activeMode === 'automatic' ? (
            <div className="flex items-start space-x-3">
              <FaRobot className="text-blue-500 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Lista Automática</h3>
                <p className="text-sm text-gray-600">
                  Gera listas baseadas na análise de produtos com estoque baixo ou crítico.
                  O sistema identifica automaticamente os itens que precisam ser repostos.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-3">
              <FaHandPaper className="text-green-500 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Lista Manual</h3>
                <p className="text-sm text-gray-600">
                  Permite selecionar manualmente os produtos e quantidades que deseja incluir
                  na lista de compras, visualizando o estoque atual de cada item.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo das abas */}
      {activeMode === 'automatic' ? (
        <SmartPurchaseListDashboard_OLD />
      ) : (
        <ManualPurchaseListDashboard />
      )}
    </div>
  );
};

export default SmartPurchaseListDashboard;
