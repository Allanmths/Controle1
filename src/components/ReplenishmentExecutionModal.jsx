import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaBox, 
  FaMapMarkerAlt, 
  FaPlus, 
  FaMinus, 
  FaExclamationTriangle, 
  FaCheckCircle 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import useFirestore from '../hooks/useFirestore';
import { useReplenishmentManagement } from '../hooks/useReplenishmentManagement';
import { REPLENISHMENT_STATUS } from '../utils/replenishmentPermissions';

const ReplenishmentExecutionModal = ({ isOpen, onClose, request }) => {
  const { user } = useAuth();
  const { docs: locations } = useFirestore('locations');
  const { updateReplenishmentRequest } = useReplenishmentManagement();
  
  const [executionData, setExecutionData] = useState({
    items: [],
    notes: '',
    executedBy: user?.displayName || user?.email,
    executionDate: new Date().toISOString()
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && request) {
      // Inicializar itens com dados da solicitaÃ§Ã£o
      const initialItems = request.items.map(item => ({
        ...item,
        selectedQuantity: item.quantity,
        selectedLocationId: '',
        selectedLocationName: '',
        executed: false
      }));
      
      setExecutionData(prev => ({
        ...prev,
        items: initialItems
      }));
    }
  }, [isOpen, request]);

  const handleItemUpdate = (index, field, value) => {
    setExecutionData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
    
    // Limpar erro especÃ­fico do item
    if (errors[`item_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`item_${index}`]: null
      }));
    }
  };

  const handleLocationSelect = (index, locationId) => {
    const selectedLocation = locations.find(loc => loc.id === locationId);
    handleItemUpdate(index, 'selectedLocationId', locationId);
    handleItemUpdate(index, 'selectedLocationName', selectedLocation?.name || '');
  };

  const handleQuantityChange = (index, delta) => {
    const currentQuantity = executionData.items[index].selectedQuantity;
    const maxQuantity = executionData.items[index].quantity;
    const newQuantity = Math.max(0, Math.min(maxQuantity, currentQuantity + delta));
    handleItemUpdate(index, 'selectedQuantity', newQuantity);
  };

  const toggleItemExecution = (index) => {
    handleItemUpdate(index, 'executed', !executionData.items[index].executed);
  };

  const validateExecution = () => {
    const newErrors = {};
    
    executionData.items.forEach((item, index) => {
      if (item.executed) {
        if (!item.selectedLocationId) {
          newErrors[`item_${index}`] = 'Selecione um local de destino';
        }
        if (item.selectedQuantity <= 0) {
          newErrors[`item_${index}`] = 'Quantidade deve ser maior que zero';
        }
      }
    });

    const hasExecutedItems = executionData.items.some(item => item.executed);
    if (!hasExecutedItems) {
      newErrors.general = 'Selecione pelo menos um item para executar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExecute = async () => {
    if (!validateExecution()) return;

    setLoading(true);
    try {
      const executedItems = executionData.items.filter(item => item.executed);
      const partialExecution = executedItems.length < executionData.items.length;
      
      const updateData = {
        status: partialExecution ? REPLENISHMENT_STATUS.IN_PROGRESS : REPLENISHMENT_STATUS.COMPLETED,
        executionData: {
          ...executionData,
          items: executedItems,
          partialExecution,
          totalItems: executionData.items.length,
          executedItems: executedItems.length
        },
        executedAt: new Date().toISOString(),
        executedBy: user.uid
      };

      await updateReplenishmentRequest(request.id, updateData);
      onClose();
    } catch (error) {
      console.error('Erro ao executar reposiÃ§Ã£o:', error);
      setErrors({ general: 'Erro ao executar reposiÃ§Ã£o. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalItems = executionData.items.length;
  const executedItemsCount = executionData.items.filter(item => item.executed).length;
  const totalValue = executionData.items
    .filter(item => item.executed)
    .reduce((sum, item) => sum + (item.selectedQuantity * (item.unitCost || 0)), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Executar ReposiÃ§Ã£o
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              SolicitaÃ§Ã£o #{request?.id?.slice(-8)} - {request?.requestedBy}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaBox className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Itens Selecionados</p>
                  <p className="text-lg font-semibold">{executedItemsCount}/{totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaMapMarkerAlt className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Locais Ãšnicos</p>
                  <p className="text-lg font-semibold">
                    {new Set(executionData.items
                      .filter(item => item.executed && item.selectedLocationId)
                      .map(item => item.selectedLocationId)
                    ).size}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <FaCheckCircle className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-lg font-semibold">R$ {totalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {executionData.items.map((item, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 transition-all ${
                  item.executed 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={item.executed}
                      onChange={() => toggleItemExecution(index)}
                      className="mr-3 w-4 h-4 text-green-600 rounded"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        SKU: {item.sku} | Quantidade solicitada: {item.quantity}
                      </p>
                    </div>
                  </div>
                  {item.executed && (
                    <FaCheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>

                {item.executed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                    {/* Local de Destino */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Local de Destino *
                      </label>
                      <select
                        value={item.selectedLocationId}
                        onChange={(e) => handleLocationSelect(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione um local</option>
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} - {location.address}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade a Executar
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, -1)}
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <FaMinus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.selectedQuantity}
                          onChange={(e) => handleItemUpdate(index, 'selectedQuantity', parseInt(e.target.value) || 0)}
                          min="0"
                          max={item.quantity}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, 1)}
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <FaPlus className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600">
                          de {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {errors[`item_${index}`] && (
                  <div className="ml-7 mt-2 flex items-center text-red-600">
                    <FaExclamationTriangle className="w-4 h-4 mr-1" />
                    <span className="text-sm">{errors[`item_${index}`]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ObservaÃ§Ãµes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ObservaÃ§Ãµes da ExecuÃ§Ã£o
            </label>
            <textarea
              value={executionData.notes}
              onChange={(e) => setExecutionData(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adicione observaÃ§Ãµes sobre a execuÃ§Ã£o..."
            />
          </div>

          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center text-red-600">
                <FaExclamationTriangle className="w-4 h-4 mr-2" />
                <span className="text-sm">{errors.general}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {executedItemsCount > 0 && executedItemsCount < totalItems && (
                <span className="text-yellow-600 font-medium">
                  âš ï¸ ExecuÃ§Ã£o parcial: {executedItemsCount} de {totalItems} itens
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Executando...' : 'Executar ReposiÃ§Ã£o'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplenishmentExecutionModal;
