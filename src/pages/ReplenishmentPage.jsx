import React, { useState, useEffect } from 'react';
import { 
  FaBoxes, 
  FaPlus, 
  FaFilter, 
  FaSearch, 
  FaEye,
  FaCheck,
  FaTimes,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt
} from 'react-icons/fa';
import { useReplenishmentManagement } from '../hooks/useReplenishmentManagement';
import { usePurchaseListManagement } from '../hooks/usePurchaseListManagement';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { PERMISSIONS } from '../utils/permissions';
import { 
  REPLENISHMENT_STATUS, 
  STATUS_DESCRIPTIONS, 
  STATUS_COLORS,
  REPLENISHMENT_PRIORITY 
} from '../utils/replenishmentPermissions';
import ReplenishmentRequestModal from '../components/ReplenishmentRequestModal';

const ReplenishmentPage = () => {
  const { userData } = useAuth();
  const { 
    requests, 
    loading, 
    fetchReplenishmentRequests, 
    getRequestStats 
  } = useReplenishmentManagement();
  const { analyzeLowStock } = usePurchaseListManagement();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [lowStockAnalysis, setLowStockAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');

  // Verificar permissões do usuário
  const canRequestReplenishment = hasPermission(userData?.role, PERMISSIONS.REQUEST_REPLENISHMENT);
  const canViewAllRequests = hasPermission(userData?.role, PERMISSIONS.VIEW_ALL_REQUESTS);
  const canApproveRequests = hasPermission(userData?.role, PERMISSIONS.APPROVE_REPLENISHMENT);
  const canGeneratePurchaseList = hasPermission(userData?.role, PERMISSIONS.GENERATE_PURCHASE_LIST);

  // Carregar dados iniciais
  useEffect(() => {
    fetchReplenishmentRequests();
    
    if (canGeneratePurchaseList) {
      loadLowStockAnalysis();
    }
  }, [fetchReplenishmentRequests, canGeneratePurchaseList]);

  const loadLowStockAnalysis = async () => {
    try {
      const analysis = await analyzeLowStock();
      setLowStockAnalysis(analysis);
    } catch (error) {
      console.error('Erro ao analisar estoque baixo:', error);
    }
  };

  // Filtrar solicitações
  const filteredRequests = requests.filter(request => {
    let matchesFilter = true;

    // Filtro por status
    if (filters.status && request.status !== filters.status) {
      matchesFilter = false;
    }

    // Filtro por prioridade
    if (filters.priority && request.priority !== filters.priority) {
      matchesFilter = false;
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      matchesFilter = matchesFilter && (
        request.title?.toLowerCase().includes(searchLower) ||
        request.requestedByName?.toLowerCase().includes(searchLower) ||
        request.description?.toLowerCase().includes(searchLower)
      );
    }

    // Se o usuário não pode ver todas as solicitações, mostrar apenas as próprias
    if (!canViewAllRequests) {
      matchesFilter = matchesFilter && request.requestedBy === userData?.uid;
    }

    return matchesFilter;
  });

  const stats = getRequestStats();

  const getStatusIcon = (status) => {
    switch (status) {
      case REPLENISHMENT_STATUS.PENDING:
        return <FaClock className="text-yellow-500" />;
      case REPLENISHMENT_STATUS.APPROVED:
        return <FaCheck className="text-green-500" />;
      case REPLENISHMENT_STATUS.REJECTED:
        return <FaTimes className="text-red-500" />;
      case REPLENISHMENT_STATUS.IN_PROGRESS:
        return <FaBoxes className="text-blue-500" />;
      case REPLENISHMENT_STATUS.COMPLETED:
        return <FaCheck className="text-gray-500" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case REPLENISHMENT_PRIORITY.CRITICAL:
        return 'bg-red-100 text-red-800';
      case REPLENISHMENT_PRIORITY.HIGH:
        return 'bg-orange-100 text-orange-800';
      case REPLENISHMENT_PRIORITY.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case REPLENISHMENT_PRIORITY.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate ? timestamp.toDate().toLocaleDateString('pt-BR') : 'N/A';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Reposição</h1>
          <p className="text-gray-600">Gerencie solicitações de reposição e listas de compras</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {canRequestReplenishment && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              <span>Nova Solicitação</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Solicitações de Reposição
          </button>
          
          {canGeneratePurchaseList && (
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Análise de Estoque
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content - Solicitações */}
      {activeTab === 'requests' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FaFileAlt className="text-gray-400" size={20} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <FaClock className="text-yellow-500" size={20} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <FaCheck className="text-green-500" size={20} />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
                </div>
                <FaBoxes className="text-gray-500" size={20} />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaSearch className="inline mr-1" size={12} />
                  Buscar
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título, solicitante..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os status</option>
                  {Object.entries(REPLENISHMENT_STATUS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {STATUS_DESCRIPTIONS[value]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as prioridades</option>
                  <option value={REPLENISHMENT_PRIORITY.CRITICAL}>Crítica</option>
                  <option value={REPLENISHMENT_PRIORITY.HIGH}>Alta</option>
                  <option value={REPLENISHMENT_PRIORITY.MEDIUM}>Média</option>
                  <option value={REPLENISHMENT_PRIORITY.LOW}>Baixa</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: '', priority: '', search: '' })}
                  className="w-full px-3 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Solicitações */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solicitante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.title}
                          </div>
                          {request.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {request.description}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${STATUS_COLORS[request.status]}-100 text-${STATUS_COLORS[request.status]}-800`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{STATUS_DESCRIPTIONS[request.status]}</span>
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority === REPLENISHMENT_PRIORITY.CRITICAL && <FaExclamationTriangle className="mr-1" />}
                          {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requestedByName || 'N/A'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.requestDate)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.items?.length || 0} itens
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {/* TODO: Implementar visualização */}}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRequests.length === 0 && (
                <div className="text-center py-12">
                  <FaBoxes size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma solicitação encontrada
                  </h3>
                  <p className="text-gray-500">
                    {canRequestReplenishment 
                      ? "Crie sua primeira solicitação de reposição"
                      : "Não há solicitações que correspondam aos filtros aplicados"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tab Content - Análise de Estoque */}
      {activeTab === 'analysis' && canGeneratePurchaseList && (
        <div className="space-y-6">
          {lowStockAnalysis ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Itens com Estoque Baixo</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {lowStockAnalysis.summary.totalItems}
                      </p>
                    </div>
                    <FaExclamationTriangle className="text-orange-500" size={20} />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Itens Críticos</p>
                      <p className="text-2xl font-bold text-red-600">
                        {lowStockAnalysis.summary.criticalItems}
                      </p>
                    </div>
                    <FaExclamationTriangle className="text-red-500" size={20} />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Custo Estimado</p>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {lowStockAnalysis.summary.totalEstimatedCost.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2
                        })}
                      </p>
                    </div>
                    <FaFileAlt className="text-blue-500" size={20} />
                  </div>
                </div>
              </div>

              {/* Lista de Itens com Estoque Baixo */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Produtos com Estoque Baixo
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque Atual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % Estoque
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade Sugerida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Custo Estimado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prioridade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lowStockAnalysis.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.sku || 'Sem SKU'}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.currentStock}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    item.stockPercentage <= 10 ? 'bg-red-500' :
                                    item.stockPercentage <= 20 ? 'bg-orange-500' :
                                    'bg-yellow-500'
                                  }`}
                                  style={{ width: `${Math.min(item.stockPercentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">
                                {item.stockPercentage}%
                              </span>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.suggestedQuantity}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {item.totalCost.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2
                            })}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority === 'critical' && <FaExclamationTriangle className="mr-1" />}
                              {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FaBoxes size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Análise de Estoque
              </h3>
              <p className="text-gray-500 mb-4">
                Clique no botão abaixo para analisar produtos com estoque baixo
              </p>
              <button
                onClick={loadLowStockAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Analisar Estoque
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Solicitação */}
      <ReplenishmentRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          fetchReplenishmentRequests();
          setShowRequestModal(false);
        }}
      />
    </div>
  );
};

export default ReplenishmentPage;
