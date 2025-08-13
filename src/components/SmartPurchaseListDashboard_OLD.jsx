import React, { useState, useEffect } from 'react';
import { 
  FaShoppingCart, 
  FaFileExport, 
  FaFilter, 
  FaSearch, 
  FaPlus,
  FaEye,
  FaDownload,
  FaDollarSign,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { usePurchaseListManagement } from '../hooks/usePurchaseListManagement';
import useFirestore from '../hooks/useFirestore';
import { hasPermission } from '../utils/permissions';
import { PERMISSIONS } from '../utils/permissions';
import { 
  PURCHASE_LIST_STATUS,
  REPLENISHMENT_CONFIG 
} from '../utils/replenishmentPermissions';
import PurchaseListModal from './PurchaseListModal';
import SkeletonLoader from './SkeletonLoader';

const SmartPurchaseListDashboard = () => {
  const { userData } = useAuth();
  const { 
    purchaseLists, 
    loading, 
    analyzeLowStock,
    generatePurchaseList,
    exportPurchaseList,
    deletePurchaseList
  } = usePurchaseListManagement();
  
  const { docs: products } = useFirestore('products');
  const { docs: suppliers } = useFirestore('suppliers');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lowStockAnalysis, setLowStockAnalysis] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [generatingList, setGeneratingList] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Verificar permissÃµes
  const canGenerate = hasPermission(userData?.role, PERMISSIONS.GENERATE_PURCHASE_LIST);
  const canExport = hasPermission(userData?.role, PERMISSIONS.EXPORT_PURCHASE_LIST);

  useEffect(() => {
    if (canGenerate) {
      loadLowStockAnalysis();
    }
  }, [canGenerate, products]);

  const loadLowStockAnalysis = async () => {
    if (products.length === 0) return;
    
    setAnalysisLoading(true);
    try {
      const analysis = await analyzeLowStock();
      setLowStockAnalysis(analysis);
    } catch (error) {
      console.error('Erro ao analisar estoque baixo:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGenerateList = async () => {
    if (!lowStockAnalysis || !lowStockAnalysis.items || lowStockAnalysis.items.length === 0) return;

    setGeneratingList(true);
    try {
      const listData = {
        title: `Lista de Compras - ${new Date().toLocaleDateString()}`,
        items: (lowStockAnalysis.items || []).map(item => ({
          productId: item.id,
          productName: item.name,
          currentStock: item.currentStock,
          minStock: item.minStock,
          maxStock: item.maxStock,
          suggestedQuantity: item.suggestedQuantity,
          unitCost: item.unitCost || 0,
          totalCost: (item.suggestedQuantity || 0) * (item.unitCost || 0),
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          priority: item.stockPercentage < REPLENISHMENT_CONFIG.CRITICAL_STOCK_PERCENTAGE 
            ? 'critical' 
            : item.stockPercentage < REPLENISHMENT_CONFIG.DEFAULT_MIN_STOCK_PERCENTAGE 
            ? 'high' 
            : 'medium'
        })),
        summary: {
          totalItems: lowStockAnalysis.items?.length || 0,
          totalCost: lowStockAnalysis.summary?.totalEstimatedCost || 0,
          criticalItems: (lowStockAnalysis.items || []).filter(item => 
            item.stockPercentage < REPLENISHMENT_CONFIG.CRITICAL_STOCK_PERCENTAGE
          ).length,
          suppliers: [...new Set((lowStockAnalysis.items || []).map(item => item.supplierId).filter(Boolean))].length
        },
        createdBy: userData.uid,
        createdByName: userData.displayName || userData.email
      };

      await generatePurchaseList(listData);
      await loadLowStockAnalysis(); // Recarregar análise
    } catch (error) {
      console.error('Erro ao gerar lista de compras:', error);
    } finally {
      setGeneratingList(false);
    }
  };

  const handleExport = async (list, format = 'excel') => {
    try {
      await exportPurchaseList(list, format);
    } catch (error) {
      console.error('Erro ao exportar lista:', error);
    }
  };

  const handleView = (list) => {
    setSelectedList(list);
    setModalOpen(true);
  };

  const handleDelete = async (listId) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista de compras?')) {
      try {
        await deletePurchaseList(listId);
      } catch (error) {
        console.error('Erro ao excluir lista:', error);
      }
    }
  };

  const filteredLists = (purchaseLists || []).filter(list => {
    const matchesSearch = 
      list.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.createdByName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || list.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const getStatusIcon = (status) => {
    const icons = {
      [PURCHASE_LIST_STATUS.GENERATED]: <FaClock className="w-4 h-4" />,
      [PURCHASE_LIST_STATUS.REVIEWED]: <FaEye className="w-4 h-4" />,
      [PURCHASE_LIST_STATUS.SENT_TO_SUPPLIER]: <FaShoppingCart className="w-4 h-4" />,
      [PURCHASE_LIST_STATUS.RECEIVED]: <FaCheckCircle className="w-4 h-4" />,
      [PURCHASE_LIST_STATUS.COMPLETED]: <FaCheckCircle className="w-4 h-4" />
    };
    return icons[status] || <FaClock className="w-4 h-4" />;
  };

  if (loading || analysisLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="p-6">
      {/* CabeÃ§alho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Lista de Compras Inteligente
          </h2>
          <p className="text-gray-600">
            Geração automática baseada em análise de estoque baixo
          </p>
        </div>
        
        {canGenerate && (
          <button
            onClick={handleGenerateList}
            disabled={!lowStockAnalysis || !lowStockAnalysis.items || lowStockAnalysis.items.length === 0 || generatingList}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus />
            <span>{generatingList ? 'Gerando...' : 'Gerar Nova Lista'}</span>
          </button>
        )}
      </div>

      {/* Análise de Estoque Baixo */}
      {lowStockAnalysis && (
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Análise de Estoque Atual
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <FaExclamationTriangle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-red-600">Itens Críticos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {lowStockAnalysis.summary.criticalItems}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <FaShoppingCart className="w-6 h-6 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-orange-600">Total de Itens</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {lowStockAnalysis.summary?.totalItems || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <FaDollarSign className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">Custo Estimado</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {(lowStockAnalysis.summary?.totalEstimatedCost || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <FaShoppingCart className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600">Fornecedores</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {[...new Set((lowStockAnalysis.items || []).map(item => item.supplierId).filter(Boolean))].length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(lowStockAnalysis.items || []).length === 0 ? (
            <div className="text-center py-8">
              <FaCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Estoque em níveis adequados
              </h4>
              <p className="text-gray-600">
                Nenhum produto está com estoque abaixo do mínimo configurado.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Próximos itens críticos:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {(lowStockAnalysis.items || []).slice(0, 5).map(item => (
                  <span 
                    key={item.id}
                    className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
                  >
                    {item.name} ({Math.round(item.stockPercentage || 0)}%)
                  </span>
                ))}
                {(lowStockAnalysis.items || []).length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    +{(lowStockAnalysis.items || []).length - 5} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar listas por título ou criador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value={PURCHASE_LIST_STATUS.GENERATED}>Gerada</option>
              <option value={PURCHASE_LIST_STATUS.REVIEWED}>Revisada</option>
              <option value={PURCHASE_LIST_STATUS.SENT_TO_SUPPLIER}>Enviada</option>
              <option value={PURCHASE_LIST_STATUS.RECEIVED}>Recebida</option>
              <option value={PURCHASE_LIST_STATUS.COMPLETED}>Concluída</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Compras */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredLists.length === 0 ? (
          <div className="p-8 text-center">
            <FaShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma lista de compras encontrada
            </h3>
            <p className="text-gray-600">
              {purchaseLists.length === 0 
                ? 'Gere sua primeira lista baseada na análise de estoque.'
                : 'Nenhuma lista corresponde aos filtros aplicados.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLists.map((list) => (
                  <tr key={list.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {list.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Por: {list.createdByName}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {list.summary?.totalItems || list.items?.length || 0} itens
                      </div>
                      <div className="text-sm text-gray-500">
                        {list.summary?.criticalItems || 0} críticos
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(list.status)}`}>
                        {getStatusIcon(list.status)}
                        <span className="ml-1 capitalize">{list.status}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {(list.summary?.totalCost || 0).toFixed(2)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleView(list)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        
                        {canExport && (
                          <button
                            onClick={() => handleExport(list)}
                            className="text-green-600 hover:text-green-900"
                            title="Exportar"
                          >
                            <FaDownload className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(list.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <PurchaseListModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedList(null);
          }}
          list={selectedList}
          onExport={handleExport}
          canExport={canExport}
        />
      )}
    </div>
  );
};

export default SmartPurchaseListDashboard;
