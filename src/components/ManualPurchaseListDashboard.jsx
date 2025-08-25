import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaPlus, 
  FaMinus, 
  FaShoppingCart, 
  FaSearch, 
  FaFilter,
  FaDownload,
  FaBoxes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useFirestore } from '../hooks/useFirestore';
import { usePurchaseListManagement } from '../hooks/usePurchaseListManagement';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ManualPurchaseListDashboard = () => {
  const { userData } = useAuth();
  const { docs: products, loading: productsLoading } = useFirestore('products');
  const { docs: suppliers } = useFirestore('suppliers');
  const { generateCustomPurchaseList, loading } = usePurchaseListManagement();

  // Estados para gerenciar a lista manual
  const [selectedItems, setSelectedItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [listNotes, setListNotes] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Função para calcular o estoque atual de um produto
  const calculateCurrentStock = (product) => {
    if (!product.locations) return 0;
    return Object.values(product.locations).reduce((total, quantity) => total + (quantity || 0), 0);
  };

  // Função para verificar se o estoque está baixo
  const isLowStock = (product) => {
    const currentStock = calculateCurrentStock(product);
    const minStock = product.minStock || 0;
    return currentStock <= minStock;
  };

  // Filtrar e processar produtos
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products
      .filter(product => product.isActive !== false)
      .filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.code?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesSupplier = !supplierFilter || product.supplierId === supplierFilter;
        const matchesLowStock = !lowStockFilter || isLowStock(product);

        return matchesSearch && matchesCategory && matchesSupplier && matchesLowStock;
      })
      .map(product => ({
        ...product,
        currentStock: calculateCurrentStock(product),
        isLowStock: isLowStock(product)
      }))
      .sort((a, b) => {
        // Ordenar por estoque baixo primeiro, depois alfabeticamente
        if (a.isLowStock && !b.isLowStock) return -1;
        if (!a.isLowStock && b.isLowStock) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchTerm, categoryFilter, supplierFilter, lowStockFilter]);

  // Obter categorias únicas
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [products]);

  // Função para alterar quantidade de um item
  const updateItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedItems };
      delete newSelected[productId];
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  // Calcular totais da lista
  const calculateTotals = () => {
    const selectedProducts = filteredProducts.filter(product => selectedItems[product.id]);
    const totalItems = selectedProducts.length;
    const totalQuantity = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
    const totalCost = selectedProducts.reduce((sum, product) => {
      const quantity = selectedItems[product.id] || 0;
      const cost = product.cost || 0;
      return sum + (quantity * cost);
    }, 0);

    return { totalItems, totalQuantity, totalCost };
  };

  // Gerar lista de compras
  const handleGenerateList = async () => {
    if (Object.keys(selectedItems).length === 0) {
      toast.error('Selecione pelo menos um produto para gerar a lista');
      return;
    }

    if (!listTitle.trim()) {
      toast.error('Digite um título para a lista');
      return;
    }

    try {
      const selectedProducts = filteredProducts
        .filter(product => selectedItems[product.id])
        .map(product => ({
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          currentStock: product.currentStock,
          requestedQuantity: selectedItems[product.id],
          unitCost: product.cost || 0,
          totalCost: (product.cost || 0) * selectedItems[product.id],
          supplierId: product.supplierId,
          supplierName: suppliers.find(s => s.id === product.supplierId)?.name || 'Não definido',
          category: product.category || 'Sem categoria',
          priority: product.isLowStock ? 'high' : 'medium',
          notes: `Solicitação manual - ${product.isLowStock ? 'Estoque baixo' : 'Reposição normal'}`
        }));

      await generateCustomPurchaseList(selectedProducts, listTitle, listNotes);
      
      toast.success('Lista de compras gerada com sucesso!');
      
      // Limpar seleções
      setSelectedItems({});
      setListTitle('');
      setListNotes('');
      setShowGenerateModal(false);
      
    } catch (error) {
      console.error('Erro ao gerar lista:', error);
      toast.error('Erro ao gerar lista de compras');
    }
  };

  const totals = calculateTotals();

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-blue-500 text-2xl mr-3" />
        <span className="text-gray-600">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lista de Compras Manual</h2>
            <p className="text-gray-600">
              Selecione os produtos e quantidades que deseja incluir na lista de compras
            </p>
          </div>
          
          {Object.keys(selectedItems).length > 0 && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaShoppingCart />
              <span>Gerar Lista ({totals.totalItems} itens)</span>
            </button>
          )}
        </div>

        {/* Resumo da seleção atual */}
        {Object.keys(selectedItems).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-600">Produtos Selecionados</p>
              <p className="text-2xl font-bold text-blue-800">{totals.totalItems}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600">Quantidade Total</p>
              <p className="text-2xl font-bold text-blue-800">{totals.totalQuantity}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600">Custo Estimado</p>
              <p className="text-2xl font-bold text-blue-800">
                R$ {totals.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Filtro por fornecedor */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os fornecedores</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>

          {/* Filtro de estoque baixo */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Apenas estoque baixo</span>
          </label>
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Produtos Disponíveis ({filteredProducts.length})
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <FaBoxes className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500">Ajuste os filtros para ver mais produtos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const quantity = selectedItems[product.id] || 0;
                  const totalCost = quantity * (product.cost || 0);

                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 ${product.isLowStock ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                              {product.isLowStock && (
                                <FaExclamationTriangle className="inline ml-2 text-red-500" title="Estoque baixo" />
                              )}
                            </div>
                          </div>
                          {product.code && (
                            <div className="text-sm text-gray-500">Código: {product.code}</div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.currentStock}
                          {product.minStock && (
                            <span className="text-xs text-gray-500 ml-1">
                              (min: {product.minStock})
                            </span>
                          )}
                        </div>
                        {product.isLowStock && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Estoque baixo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category || 'Sem categoria'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.cost ? 
                          `R$ ${product.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                          'Não definido'
                        }
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateItemQuantity(product.id, Math.max(0, quantity - 1))}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(e) => updateItemQuantity(product.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          
                          <button
                            onClick={() => updateItemQuantity(product.id, quantity + 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {totalCost > 0 ? 
                          `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                          '-'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de geração da lista */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Gerar Lista de Compras
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Lista *
                </label>
                <input
                  type="text"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  placeholder="Ex: Lista de Compras - Janeiro 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  value={listNotes}
                  onChange={(e) => setListNotes(e.target.value)}
                  placeholder="Observações sobre esta lista de compras..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Resumo */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Resumo da Lista:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Produtos: {totals.totalItems}</div>
                  <div>Quantidade total: {totals.totalQuantity}</div>
                  <div>Custo estimado: R$ {totals.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateList}
                disabled={loading || !listTitle.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <FaSpinner className="animate-spin" />}
                <span>Gerar Lista</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualPurchaseListDashboard;
