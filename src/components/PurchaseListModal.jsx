import React, { useState } from 'react';
import { 
  FaTimes, 
  FaDownload, 
  FaFileExcel, 
  FaFilePdf,
  FaShoppingCart,
  FaDollarSign,
  FaExclamationTriangle,
  FaBox,
  FaUser,
  FaCalendarAlt
} from 'react-icons/fa';
import { PURCHASE_LIST_STATUS } from '../utils/replenishmentPermissions';

const PurchaseListModal = ({ isOpen, onClose, list, onExport, canExport }) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [exporting, setExporting] = useState(false);

  if (!isOpen || !list) return null;

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await onExport(list, format);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [PURCHASE_LIST_STATUS.GENERATED]: 'bg-blue-100 text-blue-800',
      [PURCHASE_LIST_STATUS.REVIEWED]: 'bg-yellow-100 text-yellow-800',
      [PURCHASE_LIST_STATUS.SENT_TO_SUPPLIER]: 'bg-purple-100 text-purple-800',
      [PURCHASE_LIST_STATUS.RECEIVED]: 'bg-green-100 text-green-800',
      [PURCHASE_LIST_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const groupedBySupplier = list.items?.reduce((groups, item) => {
    const supplier = item.supplierName || 'Sem fornecedor';
    if (!groups[supplier]) {
      groups[supplier] = [];
    }
    groups[supplier].push(item);
    return groups;
  }, {}) || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {list.title}
            </h2>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(list.status)}`}>
                {list.status}
              </span>
              <div className="flex items-center text-sm text-gray-600">
                <FaUser className="w-3 h-3 mr-1" />
                {list.createdByName}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FaCalendarAlt className="w-3 h-3 mr-1" />
                {new Date(list.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {canExport && (
              <div className="flex items-center space-x-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
                <button
                  onClick={() => handleExport(exportFormat)}
                  disabled={exporting}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <FaDownload className="w-3 h-3" />
                  <span>{exporting ? 'Exportando...' : 'Exportar'}</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Lista</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaBox className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total de Itens</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {list.summary?.totalItems || list.items?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaExclamationTriangle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Itens Críticos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {list.summary?.criticalItems || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaDollarSign className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Custo Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {(list.summary?.totalCost || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaShoppingCart className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Fornecedores</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.keys(groupedBySupplier).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Itens por Fornecedor */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Itens Agrupados por Fornecedor
          </h3>
          
          <div className="space-y-6">
            {Object.entries(groupedBySupplier).map(([supplier, items]) => {
              const supplierTotal = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
              
              return (
                <div key={supplier} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {supplier}
                      </h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {items.length} {items.length === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          R$ {supplierTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Produto
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Estoque Atual
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Qtd. Sugerida
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Preço Unit.
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Prioridade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.productName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Min: {item.minStock} | Max: {item.maxStock}
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm ${
                                item.currentStock <= item.minStock 
                                  ? 'text-red-600 font-semibold' 
                                  : 'text-gray-900'
                              }`}>
                                {item.currentStock}
                              </span>
                            </td>
                            
                            <td className="px-4 py-3 text-center text-sm text-gray-900">
                              {item.suggestedQuantity}
                            </td>
                            
                            <td className="px-4 py-3 text-center text-sm text-gray-900">
                              R$ {(item.unitCost || 0).toFixed(2)}
                            </td>
                            
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                              R$ {(item.totalCost || 0).toFixed(2)}
                            </td>
                            
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                {item.priority === 'critical' ? 'Crítico' :
                                 item.priority === 'high' ? 'Alto' :
                                 item.priority === 'medium' ? 'Médio' : 'Baixo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {list.items?.length === 0 && (
            <div className="text-center py-8">
              <FaBox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Lista vazia
              </h4>
              <p className="text-gray-600">
                Esta lista não contém itens.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Lista criada em {new Date(list.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-lg font-semibold text-gray-900">
                Total Geral: R$ {(list.summary?.totalCost || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseListModal;
