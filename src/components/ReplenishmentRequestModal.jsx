import React, { useState, useEffect } from 'react';
import { FaTimes, FaBoxes, FaExclamationTriangle, FaPlus, FaTrash, FaSearch } from 'react-icons/fa';
import { useReplenishmentManagement } from '../hooks/useReplenishmentManagement';
import { 
  collection, 
  getDocs, 
  query
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { REPLENISHMENT_PRIORITY } from '../utils/replenishmentPermissions';

const ReplenishmentRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { createReplenishmentRequest, loading } = useReplenishmentManagement();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: REPLENISHMENT_PRIORITY.MEDIUM,
    items: []
  });
  const [errors, setErrors] = useState({});

  // Buscar produtos disponÃ­veis
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const stockQuery = query(collection(db, 'stock'));
        const stockSnapshot = await getDocs(stockQuery);
        const stockData = stockSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calcular estoque atual para cada produto
        const stockByProduct = {};
        stockData.forEach(stock => {
          if (!stockByProduct[stock.productId]) {
            stockByProduct[stock.productId] = 0;
          }
          stockByProduct[stock.productId] += stock.quantity || 0;
        });

        // Adicionar informaÃ§Ãµes de estoque aos produtos
        const productsWithStock = productsData
          .filter(product => product.isActive !== false)
          .map(product => ({
            ...product,
            currentStock: stockByProduct[product.id] || 0,
            isLowStock: (stockByProduct[product.id] || 0) <= (product.minStock || 0)
          }));

        setProducts(productsWithStock);
        setFilteredProducts(productsWithStock);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Filtrar produtos por termo de busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleAddItem = (product) => {
    const existingItem = formData.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Se jÃ¡ existe, aumenta a quantidade
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === product.id
            ? { ...item, requestedQuantity: item.requestedQuantity + 1 }
            : item
        )
      }));
    } else {
      // Adiciona novo item
      const newItem = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku || '',
        currentStock: product.currentStock,
        minStock: product.minStock || 0,
        requestedQuantity: 1,
        reason: product.isLowStock ? 'Estoque baixo' : '',
        priority: product.isLowStock ? REPLENISHMENT_PRIORITY.HIGH : REPLENISHMENT_PRIORITY.MEDIUM
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
  };

  const handleRemoveItem = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const handleItemChange = (productId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'TÃ­tulo Ã© obrigatÃ³rio';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Adicione pelo menos um item Ã  solicitaÃ§Ã£o';
    }

    formData.items.forEach((item, index) => {
      if (!item.requestedQuantity || item.requestedQuantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantidade deve ser maior que zero';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createReplenishmentRequest(formData);
      
      // Limpar formulÃ¡rio
      setFormData({
        title: '',
        description: '',
        priority: REPLENISHMENT_PRIORITY.MEDIUM,
        items: []
      });
      setSearchTerm('');
      setErrors({});
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao criar solicitaÃ§Ã£o:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case REPLENISHMENT_PRIORITY.CRITICAL:
        return 'text-red-600 bg-red-100';
      case REPLENISHMENT_PRIORITY.HIGH:
        return 'text-orange-600 bg-orange-100';
      case REPLENISHMENT_PRIORITY.MEDIUM:
        return 'text-yellow-600 bg-yellow-100';
      case REPLENISHMENT_PRIORITY.LOW:
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FaBoxes className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Nova SolicitaÃ§Ã£o de ReposiÃ§Ã£o</h2>
              <p className="text-sm text-gray-600">Solicite reposiÃ§Ã£o de produtos com estoque baixo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* InformaÃ§Ãµes da SolicitaÃ§Ã£o */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">InformaÃ§Ãµes da SolicitaÃ§Ã£o</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TÃ­tulo da SolicitaÃ§Ã£o *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: ReposiÃ§Ã£o urgente de materiais de escritÃ³rio"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={REPLENISHMENT_PRIORITY.LOW}>Baixa</option>
                    <option value={REPLENISHMENT_PRIORITY.MEDIUM}>MÃ©dia</option>
                    <option value={REPLENISHMENT_PRIORITY.HIGH}>Alta</option>
                    <option value={REPLENISHMENT_PRIORITY.CRITICAL}>CrÃ­tica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DescriÃ§Ã£o / Justificativa
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva o motivo da solicitaÃ§Ã£o e qualquer informaÃ§Ã£o adicional relevante..."
                  />
                </div>

                {/* Itens Selecionados */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Itens Selecionados ({formData.items.length})
                  </h4>
                  
                  {errors.items && <p className="text-red-500 text-xs mb-2">{errors.items}</p>}
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.items.map((item, index) => (
                      <div key={item.productId} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-medium text-sm truncate">{item.productName}</h5>
                              {item.productSku && (
                                <span className="text-xs text-gray-500">({item.productSku})</span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                              <span>Estoque atual: {item.currentStock}</span>
                              <span>Estoque mÃ­nimo: {item.minStock}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-700 mb-1">Quantidade</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.requestedQuantity}
                                  onChange={(e) => handleItemChange(item.productId, 'requestedQuantity', parseInt(e.target.value) || 0)}
                                  className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-700 mb-1">Prioridade</label>
                                <select
                                  value={item.priority}
                                  onChange={(e) => handleItemChange(item.productId, 'priority', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value={REPLENISHMENT_PRIORITY.LOW}>Baixa</option>
                                  <option value={REPLENISHMENT_PRIORITY.MEDIUM}>MÃ©dia</option>
                                  <option value={REPLENISHMENT_PRIORITY.HIGH}>Alta</option>
                                  <option value={REPLENISHMENT_PRIORITY.CRITICAL}>CrÃ­tica</option>
                                </select>
                              </div>
                            </div>

                            <div className="mt-2">
                              <label className="block text-xs text-gray-700 mb-1">Motivo</label>
                              <input
                                type="text"
                                value={item.reason}
                                onChange={(e) => handleItemChange(item.productId, 'reason', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Motivo da solicitaÃ§Ã£o..."
                              />
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {formData.items.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FaBoxes size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum item selecionado</p>
                        <p className="text-xs">Use a busca ao lado para adicionar produtos</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SeleÃ§Ã£o de Produtos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Selecionar Produtos</h3>
                
                {/* Busca de Produtos */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Buscar produtos por nome, SKU ou categoria..."
                  />
                </div>

                {/* Lista de Produtos */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredProducts.map(product => {
                    const isSelected = formData.items.some(item => item.productId === product.id);
                    
                    return (
                      <div
                        key={product.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          isSelected ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleAddItem(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{product.name}</h4>
                              {product.sku && (
                                <span className="text-xs text-gray-500">({product.sku})</span>
                              )}
                              {product.isLowStock && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                                  <FaExclamationTriangle className="mr-1" size={10} />
                                  Estoque Baixo
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <span>Estoque: {product.currentStock}</span>
                              <span>MÃ­nimo: {product.minStock || 'N/A'}</span>
                              {product.category && <span>Categoria: {product.category}</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isSelected && (
                              <span className="text-blue-600 text-xs font-medium">Selecionado</span>
                            )}
                            <button
                              type="button"
                              className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Nenhum produto encontrado</p>
                      {searchTerm && (
                        <p className="text-xs">Tente ajustar os termos de busca</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar SolicitaÃ§Ã£o'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplenishmentRequestModal;
