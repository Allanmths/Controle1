import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaBox, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaUser, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaPlay, 
  FaEye, 
  FaFileAlt 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useReplenishmentManagement } from '../hooks/useReposicaoManagement';
import { hasPermission } from '../utils/permissions';
import { REPLENISHMENT_PERMISSIONS, REPLENISHMENT_STATUS, STATUS_DESCRIPTIONS, STATUS_COLORS } from '../utils/replenishmentPermissions';
import ReplenishmentExecutionModal from './ReplenishmentExecutionModal';
import SkeletonLoader from './SkeletonLoader';

const ExecutionDashboard = () => {
  const { user } = useAuth();
  const { requests, loading } = useReplenishmentManagement();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Filtrar apenas reposições aprovadas ou em execução
  const executableRequests = requests.filter(request => 
    [REPLENISHMENT_STATUS.APPROVED, REPLENISHMENT_STATUS.IN_PROGRESS].includes(request.status)
  );

  // Aplicar filtros
  const filteredRequests = executableRequests.filter(request => {
    const matchesSearch = 
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // EstatÃ­sticas
  const stats = {
    total: executableRequests.length,
    approved: executableRequests.filter(r => r.status === REPLENISHMENT_STATUS.APPROVED).length,
    inProgress: executableRequests.filter(r => r.status === REPLENISHMENT_STATUS.IN_PROGRESS).length,
    totalValue: executableRequests.reduce((sum, request) => 
      sum + request.items.reduce((itemSum, item) => 
        itemSum + (item.quantity * (item.unitCost || 0)), 0
      ), 0
    )
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case REPLENISHMENT_STATUS.APPROVED:
        return <FaCheckCircle className="w-4 h-4" />;
      case REPLENISHMENT_STATUS.IN_PROGRESS:
        return <FaClock className="w-4 h-4" />;
      default:
        return <FaExclamationTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [REPLENISHMENT_STATUS.APPROVED]: 'bg-green-100 text-green-800',
      [REPLENISHMENT_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleExecute = (request) => {
    setSelectedRequest(request);
    setExecutionModalOpen(true);
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const canExecute = hasPermission(user, REPLENISHMENT_PERMISSIONS.EXECUTE_REPLENISHMENT);

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Execução de Reposição
        </h2>
        <p className="text-gray-600">
          Execute reposições aprovadas selecionando itens e destinos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FaBox className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total para Execução</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FaCheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Aprovadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FaClock className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Em Execução</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FaFileAlt className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {stats.totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por ID, solicitante ou produto..."
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
              <option value={REPLENISHMENT_STATUS.APPROVED}>Aprovadas</option>
              <option value={REPLENISHMENT_STATUS.IN_PROGRESS}>Em Execução</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de ReposiÃ§Ãµes */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <FaBox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma reposição para execução
            </h3>
            <p className="text-gray-600">
              {executableRequests.length === 0 
                ? 'Não há reposições aprovadas no momento.'
                : 'Nenhuma reposição corresponde aos filtros aplicados.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
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
                {filteredRequests.map((request) => {
                  const totalValue = request.items.reduce((sum, item) => 
                    sum + (item.quantity * (item.unitCost || 0)), 0
                  );

                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{request.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FaUser className="w-3 h-3 mr-1" />
                            {request.requestedBy}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.items.slice(0, 2).map(item => item.name).join(', ')}
                          {request.items.length > 2 && ` +${request.items.length - 2}`}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{STATUS_DESCRIPTIONS[request.status]}</span>
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {totalValue.toFixed(2)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FaCalendarAlt className="w-3 h-3 mr-1" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(request)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Ver detalhes"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          
                          {canExecute && request.status === REPLENISHMENT_STATUS.APPROVED && (
                            <button
                              onClick={() => handleExecute(request)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center"
                            >
                              <FaPlay className="w-3 h-3 mr-1" />
                              Executar
                            </button>
                          )}
                          
                          {canExecute && request.status === REPLENISHMENT_STATUS.IN_PROGRESS && (
                            <button
                              onClick={() => handleExecute(request)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center"
                            >
                              <FaClock className="w-3 h-3 mr-1" />
                              Continuar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {executionModalOpen && (
        <ReplenishmentExecutionModal
          isOpen={executionModalOpen}
          onClose={() => {
            setExecutionModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}
    </div>
  );
};

export default ExecutionDashboard;
