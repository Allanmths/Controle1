import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { FaHistory, FaFilter, FaCalendarAlt, FaTrash, FaEye, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationHistory = () => {
  const navigate = useNavigate();
  const { notifications, removeNotification, markAsRead } = useNotifications();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(null);

  // Filtros aplicados
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtro por tipo
      if (filterType !== 'all' && notification.type !== filterType) return false;
      
      // Filtro por status
      if (filterStatus === 'read' && !notification.read) return false;
      if (filterStatus === 'unread' && notification.read) return false;
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          notification.title?.toLowerCase().includes(searchLower) ||
          notification.message?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [notifications, filterType, filterStatus, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {});

    return { total, unread, read: total - unread, byType };
  }, [notifications]);

  // Exportar histórico
  const exportHistory = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalNotifications: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read,
        category: n.category
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notificacoes-historico-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNotificationClick = (notification) => {
    // Marcar como lida se não foi lida ainda
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Lógica de redirecionamento
    if (notification.action?.href) {
      if (notification.action.href.startsWith('http')) {
        window.open(notification.action.href, '_blank');
      } else {
        navigate(notification.action.href);
      }
    } else if (notification.category === 'stock' && notification.productName) {
      navigate(`/stock?search=${encodeURIComponent(notification.productName)}`);
    } else if (notification.category === 'movement') {
      navigate('/movements');
    } else if (notification.category === 'system') {
      navigate('/settings');
    } else {
      navigate('/');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'info': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header com estatísticas */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FaHistory className="text-2xl text-blue-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Histórico de Notificações
            </h3>
          </div>
          <button
            onClick={exportHistory}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaDownload className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Não Lidas</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lidas</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byType).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tipos</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos os tipos</option>
            <option value="success">Sucesso</option>
            <option value="warning">Aviso</option>
            <option value="error">Erro</option>
            <option value="info">Informação</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos os status</option>
            <option value="unread">Não lidas</option>
            <option value="read">Lidas</option>
          </select>
        </div>
      </div>

      {/* Lista de notificações */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <FaHistory className="mx-auto mb-3 text-3xl opacity-50" />
            <p>Nenhuma notificação encontrada</p>
            {searchTerm && (
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            )}
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
              } ${notification.action?.href ? 'cursor-pointer' : ''}`}
              onClick={() => handleNotificationClick(notification)}
              title={notification.action?.href ? 'Clique para navegar' : ''}
            >
              <div className="flex items-start gap-3">
                {/* Tipo/Ícone */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                  <span className="text-sm">{getTypeIcon(notification.type)}</span>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        notification.read 
                          ? 'text-gray-700 dark:text-gray-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        notification.read 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {/* Metadados */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{format(new Date(notification.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        <span>{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR })}</span>
                        {notification.category && (
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                            {notification.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setShowDetails(showDetails === notification.id ? null : notification.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Ver detalhes"
                      >
                        <FaEye className="w-3 h-3" />
                      </button>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                          title="Marcar como lida"
                        >
                          <FaEye className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Remover"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {showDetails === notification.id && (
                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-lg text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>ID:</strong> {notification.id}</div>
                        <div><strong>Tipo:</strong> {notification.type}</div>
                        <div><strong>Status:</strong> {notification.read ? 'Lida' : 'Não lida'}</div>
                        <div><strong>Categoria:</strong> {notification.category || 'N/A'}</div>
                        {notification.productId && (
                          <div><strong>Produto ID:</strong> {notification.productId}</div>
                        )}
                        {notification.action && (
                          <div><strong>Ação:</strong> {notification.action.label}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;
