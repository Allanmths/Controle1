import React, { useState, useEffect } from 'react';
import { 
  FaClock, 
  FaExclamationTriangle, 
  FaUser,
  FaCalendarAlt,
  FaBoxes,
  FaCheck,
  FaTimes,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import { useReplenishmentManagement } from '../hooks/useReposicaoManagement';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';
import { PERMISSIONS } from '../utils/permissions';
import { 
  REPLENISHMENT_STATUS, 
  REPLENISHMENT_PRIORITY,
  STATUS_DESCRIPTIONS 
} from '../utils/replenishmentPermissions';
import ReplenishmentApprovalModal from './ReplenishmentApprovalModal';

const ApprovalDashboard = () => {
  const { userData } = useAuth();
  const { 
    requests, 
    loading, 
    fetchReplenishmentRequests,
    approveRequest,
    rejectRequest 
  } = useReplenishmentManagement();
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    search: '',
    dateRange: 'all'
  });

  // Verificar se usuário pode aprovar
  const canApprove = hasPermission(userData?.role, PERMISSIONS.APPROVE_REPLENISHMENT);

  useEffect(() => {
    if (canApprove) {
      fetchReplenishmentRequests({ status: REPLENISHMENT_STATUS.PENDING });
    }
  }, [canApprove, fetchReplenishmentRequests]);

    // Filtrar apenas solicitações pendentes
  const pendingRequests = requests.filter(request => 
    request.status === REPLENISHMENT_STATUS.PENDING
  );

  // Aplicar filtros
  const filteredRequests = pendingRequests.filter(request => {
    let matches = true;

    // Filtro por prioridade
    if (filters.priority && request.priority !== filters.priority) {
      matches = false;
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      matches = matches && (
        request.title?.toLowerCase().includes(searchLower) ||
        request.requestedByName?.toLowerCase().includes(searchLower) ||
        request.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por data
    if (filters.dateRange !== 'all' && request.requestDate) {
      const requestDate = request.requestDate.toDate();
      const now = new Date();
      const daysDiff = Math.floor((now - requestDate) / (1000 * 60 * 60 * 24));

      switch (filters.dateRange) {
        case 'today':
          matches = matches && daysDiff === 0;
          break;
        case 'week':
          matches = matches && daysDiff <= 7;
          break;
        case 'month':
          matches = matches && daysDiff <= 30;
          break;
        default:
          break;
      }
    }

    return matches;
  });

  // Estatísticas rápidas
  const stats = {
    total: pendingRequests.length,
    critical: pendingRequests.filter(r => r.priority === REPLENISHMENT_PRIORITY.CRITICAL).length,
    high: pendingRequests.filter(r => r.priority === REPLENISHMENT_PRIORITY.HIGH).length,
    oldRequests: pendingRequests.filter(r => {
      if (!r.requestDate) return false;
      const daysDiff = Math.floor((new Date() - r.requestDate.toDate()) / (1000 * 60 * 60 * 24));
      return daysDiff > 3;
    }).length
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case REPLENISHMENT_PRIORITY.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case REPLENISHMENT_PRIORITY.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case REPLENISHMENT_PRIORITY.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case REPLENISHMENT_PRIORITY.LOW:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate ? timestamp.toDate().toLocaleDateString('pt-BR') : 'N/A';
  };

  const formatDateWithTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const getDaysAgo = (timestamp) => {
    if (!timestamp) return 0;
    const requestDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    return Math.floor((now - requestDate) / (1000 * 60 * 60 * 24));
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleApprovalSuccess = () => {
    fetchReplenishmentRequests();
    setShowApprovalModal(false);
    setSelectedRequest(null);
  };

  // Ação rápida de aprovação
  const handleQuickApprove = async (request, e) => {
    e.stopPropagation();
    try {
      await approveRequest(request.id, {
        notes: 'Aprovação rápida via dashboard'
      });
      await fetchReplenishmentRequests();
    } catch (error) {
      console.error('Erro na aprovação rápida:', error);
    }
  };

  if (!canApprove) {
    return (
      <div className="text-center py-12">
        <FaClock size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acesso Restrito
        </h3>
        <p className="text-gray-500">
          Você não tem permissão para aprovar solicitações
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.total}</p>
            </div>
            <FaClock className="text-yellow-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Críticas</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <FaExclamationTriangle className="text-red-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Alta Prioridade</p>
              <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
            </div>
            <FaExclamationTriangle className="text-orange-500" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Antigas (+3 dias)</p>
              <p className="text-2xl font-bold text-gray-600">{stats.oldRequests}</p>
            </div>
            <FaCalendarAlt className="text-gray-500" size={20} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de SolicitaÃ§Ãµes Pendentes */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Solicitações Aguardando Aprovação ({filteredRequests.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredRequests.map((request) => {
            const daysAgo = getDaysAgo(request.requestDate);
            const isOld = daysAgo > 3;
            
            return (
              <div
                key={request.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleViewRequest(request)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {request.title}
                      </h4>
                      
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                        {request.priority === REPLENISHMENT_PRIORITY.CRITICAL && <FaExclamationTriangle className="mr-1" />}
                        {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1)}
                      </span>
                      
                      {isOld && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          <FaClock className="mr-1" />
                          {daysAgo} dias
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-2">
                        <FaUser className="text-gray-400" size={14} />
                        <span>{request.requestedByName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className="text-gray-400" size={14} />
                        <span>{formatDate(request.requestDate)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FaBoxes className="text-gray-400" size={14} />
                        <span>{request.items?.length || 0} produtos</span>
                      </div>
                    </div>
                    
                    {request.description && (
                      <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                        {request.description}
                      </p>
                    )}
                    
                    {/* Preview dos itens */}
                    <div className="flex flex-wrap gap-1">
                      {request.items?.slice(0, 3).map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {item.productName} ({item.requestedQuantity})
                        </span>
                      ))}
                      {request.items?.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-600">
                          +{request.items.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* AÃ§Ãµes */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => handleQuickApprove(request, e)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="AprovaÃ§Ã£o rÃ¡pida"
                    >
                      <FaCheck size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleViewRequest(request)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Analisar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <FaCheck size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma solicitação pendente
              </h3>
              <p className="text-gray-500">
                {pendingRequests.length === 0 
                  ? "Não há solicitações aguardando aprovação" 
                  : "Nenhuma solicitação corresponde aos filtros aplicados"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Aprovação */}
      <ReplenishmentApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={handleApprovalSuccess}
      />
    </div>
  );
};

export default ApprovalDashboard;
