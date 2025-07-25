import React, { useState } from 'react';
import { 
  FaTimes, 
  FaCheck, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaUser,
  FaCalendarAlt,
  FaBoxes,
  FaClock
} from 'react-icons/fa';
import { useReplenishmentManagement } from '../hooks/useReplenishmentManagement';
import { 
  REPLENISHMENT_STATUS, 
  REPLENISHMENT_PRIORITY,
  STATUS_DESCRIPTIONS 
} from '../utils/replenishmentPermissions';

const ReplenishmentApprovalModal = ({ isOpen, onClose, request, onSuccess }) => {
  const { approveRequest, rejectRequest, loading } = useReplenishmentManagement();
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [formData, setFormData] = useState({
    notes: '',
    reason: '',
    adjustments: []
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleApprove = () => {
    setAction('approve');
    setShowConfirmation(true);
  };

  const handleReject = () => {
    setAction('reject');
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      if (action === 'approve') {
        await approveRequest(request.id, {
          notes: formData.notes
        });
      } else {
        await rejectRequest(request.id, {
          reason: formData.reason,
          notes: formData.notes
        });
      }
      
      setShowConfirmation(false);
      setAction('');
      setFormData({ notes: '', reason: '', adjustments: [] });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao processar solicitaÃ§Ã£o:', error);
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

  const calculateTotalItems = () => {
    return request?.items?.reduce((total, item) => total + (item.requestedQuantity || 0), 0) || 0;
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FaBoxes className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">AnÃ¡lise de SolicitaÃ§Ã£o</h2>
              <p className="text-sm text-gray-600">#{request.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* InformaÃ§Ãµes da SolicitaÃ§Ã£o */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">InformaÃ§Ãµes da SolicitaÃ§Ã£o</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FaUser className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">Solicitante:</span>
                  <span className="font-medium">{request.requestedByName}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FaCalendarAlt className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">Data:</span>
                  <span className="font-medium">{formatDate(request.requestDate)}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FaClock className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="font-medium">{STATUS_DESCRIPTIONS[request.status]}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Prioridade:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority === REPLENISHMENT_PRIORITY.CRITICAL && <FaExclamationTriangle className="mr-1" />}
                    {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <FaBoxes className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">Total de Itens:</span>
                  <span className="font-medium">{calculateTotalItems()} unidades</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Produtos:</span>
                  <span className="font-medium">{request.items?.length || 0} diferentes</span>
                </div>
              </div>
            </div>
          </div>

          {/* TÃ­tulo e DescriÃ§Ã£o */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">{request.title}</h4>
            {request.description && (
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{request.description}</p>
            )}
          </div>

          {/* Lista de Itens */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Itens Solicitados</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque Atual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade Solicitada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {request.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          {item.productSku && (
                            <div className="text-sm text-gray-500">SKU: {item.productSku}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.currentStock}</span>
                          <span className="text-xs text-gray-500">MÃ­n: {item.minStock}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.requestedQuantity}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.reason || 'NÃ£o informado'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FormulÃ¡rio de AprovaÃ§Ã£o/RejeiÃ§Ã£o */}
          {!showConfirmation && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">AnÃ¡lise da SolicitaÃ§Ã£o</h4>
              
              {action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da RejeiÃ§Ã£o *
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">Selecione o motivo</option>
                    <option value="OrÃ§amento insuficiente">OrÃ§amento insuficiente</option>
                    <option value="Produto descontinuado">Produto descontinuado</option>
                    <option value="Quantidade excessiva">Quantidade excessiva</option>
                    <option value="Fornecedor indisponÃ­vel">Fornecedor indisponÃ­vel</option>
                    <option value="PolÃ­tica da empresa">PolÃ­tica da empresa</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ObservaÃ§Ãµes {action === 'reject' ? '(ObrigatÃ³rio)' : '(Opcional)'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    action === 'approve' 
                      ? "Adicione observaÃ§Ãµes sobre a aprovaÃ§Ã£o (opcional)..."
                      : "Explique detalhadamente o motivo da rejeiÃ§Ã£o..."
                  }
                />
              </div>
            </div>
          )}

          {/* ConfirmaÃ§Ã£o */}
          {showConfirmation && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  action === 'approve' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {action === 'approve' ? (
                    <FaCheck className="text-green-600" />
                  ) : (
                    <FaTimesCircle className="text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="text-lg font-medium text-gray-900">
                    Confirmar {action === 'approve' ? 'AprovaÃ§Ã£o' : 'RejeiÃ§Ã£o'}
                  </h5>
                  <p className="text-gray-700 mt-1">
                    Tem certeza que deseja {action === 'approve' ? 'aprovar' : 'rejeitar'} esta solicitaÃ§Ã£o?
                  </p>
                  
                  {action === 'approve' && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>ApÃ³s a aprovaÃ§Ã£o:</strong><br />
                        â€¢ O solicitante serÃ¡ notificado<br />
                        â€¢ A solicitaÃ§Ã£o ficarÃ¡ disponÃ­vel para execuÃ§Ã£o<br />
                        â€¢ Um documento de reposiÃ§Ã£o serÃ¡ gerado
                      </p>
                    </div>
                  )}

                  {action === 'reject' && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Motivo:</strong> {formData.reason}<br />
                        {formData.notes && (
                          <>
                            <strong>ObservaÃ§Ãµes:</strong> {formData.notes}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          {!showConfirmation ? (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center space-x-2"
              >
                <FaTimesCircle />
                <span>Rejeitar</span>
              </button>
              
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2"
              >
                <FaCheck />
                <span>Aprovar</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setAction('');
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Voltar
              </button>
              
              <button
                onClick={handleConfirm}
                disabled={loading || (action === 'reject' && (!formData.reason || !formData.notes))}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 flex items-center space-x-2 ${
                  action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {action === 'approve' ? <FaCheck /> : <FaTimesCircle />}
                <span>
                  {loading ? 'Processando...' : `Confirmar ${action === 'approve' ? 'AprovaÃ§Ã£o' : 'RejeiÃ§Ã£o'}`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReplenishmentApprovalModal;
