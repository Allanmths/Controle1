import React, { useState, useEffect } from 'react';
import { NotificationStorage } from '../utils/notificationStorage';
import { FaDownload, FaUpload, FaTrash, FaChartLine, FaEye } from 'react-icons/fa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationAdmin = () => {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const allNotifications = NotificationStorage.getAll();
      const statsData = NotificationStorage.getStats();
      
      setNotifications(allNotifications);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = NotificationStorage.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notificacoes-completo-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const result = NotificationStorage.import(data);
        
        if (result.success) {
          alert(`âœ… ImportaÃ§Ã£o concluÃ­da! ${result.imported} notificaÃ§Ãµes importadas.`);
          loadData();
        } else {
          alert(`âŒ Erro na importaÃ§Ã£o: ${result.error}`);
        }
      } catch (error) {
        alert(`âŒ Erro ao processar arquivo: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const clearOldNotifications = () => {
    if (confirm('Deseja remover notificaÃ§Ãµes com mais de 30 dias?')) {
      const result = NotificationStorage.cleanOldNotifications(30);
      alert(`âœ… Limpeza concluÃ­da! ${result.removedCount} notificaÃ§Ãµes removidas. ${result.remaining} restantes.`);
      loadData();
    }
  };

  const clearAllNotifications = () => {
    if (confirm('âš ï¸ ATENÃ‡ÃƒO: Isso irÃ¡ remover TODAS as notificaÃ§Ãµes permanentemente. Confirma?')) {
      NotificationStorage.clear();
      alert('âœ… Todas as notificaÃ§Ãµes foram removidas.');
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaChartLine className="mr-3 text-blue-500" />
            AdministraÃ§Ã£o de NotificaÃ§Ãµes
          </h3>
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              Exportar
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <FaUpload className="w-4 h-4" />
              Importar
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* EstatÃ­sticas Detalhadas */}
      {stats && (
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ðŸ“Š EstatÃ­sticas Detalhadas</h4>
          
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de NotificaÃ§Ãµes</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.unread}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">NÃ£o Lidas</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.read}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lidas</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byCategory).length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categorias</div>
            </div>
          </div>

          {/* Por Tipo */}
          <div className="mb-6">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Por Tipo:</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
                  <div className="font-bold text-gray-900 dark:text-white">{count}</div>
                  <div className="text-sm capitalize text-gray-600 dark:text-gray-400">{type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Por Categoria */}
          <div className="mb-6">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Por Categoria:</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-center">
                  <div className="font-bold text-gray-900 dark:text-white">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{category}</div>
                </div>
              ))}
            </div>
          </div>

          {/* InformaÃ§Ãµes de Datas */}
          {stats.oldestNotification && stats.newestNotification && (
            <div className="mb-6">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3">PerÃ­odo:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Mais Antiga:</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(stats.oldestNotification), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Mais Recente:</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(stats.newestNotification), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ãšltimos 7 dias */}
          <div className="mb-6">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Ãšltimos 7 dias:</h5>
            <div className="grid grid-cols-7 gap-1">
              {Object.entries(stats.last7Days).reverse().map(([date, count]) => (
                <div key={date} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(date), 'dd/MM')}
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AÃ§Ãµes de AdministraÃ§Ã£o */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">ðŸ”§ AÃ§Ãµes de AdministraÃ§Ã£o:</h5>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={clearOldNotifications}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <FaTrash className="w-4 h-4" />
                Limpar Antigas (30+ dias)
              </button>
              <button
                onClick={clearAllNotifications}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash className="w-4 h-4" />
                Limpar Todas (CUIDADO!)
              </button>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaEye className="w-4 h-4" />
                Recarregar Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationAdmin;
