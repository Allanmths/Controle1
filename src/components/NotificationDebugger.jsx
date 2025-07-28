import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { FaBug, FaPlay, FaPause, FaTrash, FaEye } from 'react-icons/fa';

const NotificationDebugger = () => {
  const { notifications } = useNotifications();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    showDuplicates: true,
    showFrequent: true,
    timeWindow: 60 // segundos
  });

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      analyzeNotifications();
    }, 5000); // Análise a cada 5 segundos

    return () => clearInterval(interval);
  }, [isMonitoring, notifications, filters]);

  const analyzeNotifications = () => {
    const now = Date.now();
    const timeWindow = filters.timeWindow * 1000; // converter para ms
    const recentNotifications = notifications.filter(n => 
      now - new Date(n.timestamp).getTime() < timeWindow
    );

    // Detectar duplicatas
    const duplicates = findDuplicates(recentNotifications);
    
    // Detectar notificaÃ§Ãµes muito frequentes
    const frequent = findFrequentNotifications(recentNotifications);
    
    // Atualizar estatÃ­sticas
    const newStats = {
      total: notifications.length,
      recent: recentNotifications.length,
      duplicates: duplicates.length,
      frequent: frequent.length,
      timestamp: new Date().toISOString()
    };

    setStats(newStats);

    // Adicionar ao log se encontrou problemas
    if (duplicates.length > 0 || frequent.length > 0) {
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'warning',
        duplicates,
        frequent,
        stats: newStats
      };
      
      setDebugLog(prev => [logEntry, ...prev.slice(0, 19)]); // Manter Ãºltimas 20 entradas
    }
  };

  const findDuplicates = (notifications) => {
    const seen = new Map();
    const duplicates = [];

    notifications.forEach(notification => {
      const key = `${notification.type}_${notification.title}_${notification.productId || 'no-product'}`;
      
      if (seen.has(key)) {
        const existing = seen.get(key);
        const timeDiff = new Date(notification.timestamp).getTime() - new Date(existing.timestamp).getTime();
        
        if (timeDiff < 60000) { // Menos de 1 minuto
          duplicates.push({
            original: existing,
            duplicate: notification,
            timeDiff: timeDiff / 1000 // em segundos
          });
        }
      } else {
        seen.set(key, notification);
      }
    });

    return duplicates;
  };

  const findFrequentNotifications = (notifications) => {
    const frequency = new Map();
    
    notifications.forEach(notification => {
      const key = `${notification.type}_${notification.productId || 'system'}`;
      frequency.set(key, (frequency.get(key) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .filter(([key, count]) => count > 5) // Mais de 5 notificaÃ§Ãµes no perÃ­odo
      .map(([key, count]) => ({ key, count }));
  };

  const clearDebugLog = () => {
    setDebugLog([]);
  };

  const exportDebugData = () => {
    const debugData = {
      exportTime: new Date().toISOString(),
      stats,
      debugLog,
      recentNotifications: notifications.slice(0, 20),
      filters
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaBug className="mr-3 text-red-500" />
          Debugger de NotificaÃ§Ãµes
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
            {isMonitoring ? 'Parar' : 'Monitorar'}
          </button>
          <button
            onClick={exportDebugData}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaEye className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* ConfiguraÃ§Ãµes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Janela de Tempo (segundos)
          </label>
          <input
            type="number"
            value={filters.timeWindow}
            onChange={(e) => setFilters(prev => ({ ...prev, timeWindow: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
            min="30"
            max="3600"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={filters.showDuplicates}
            onChange={(e) => setFilters(prev => ({ ...prev, showDuplicates: e.target.checked }))}
            className="mr-2"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">Detectar Duplicatas</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={filters.showFrequent}
            onChange={(e) => setFilters(prev => ({ ...prev, showFrequent: e.target.checked }))}
            className="mr-2"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">Detectar Frequentes</label>
        </div>
      </div>

      {/* EstatÃ­sticas */}
      {stats.timestamp && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.recent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Recentes</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.duplicates}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Duplicatas</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.frequent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Frequentes</div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status: {isMonitoring ? 'ðŸŸ¢ Monitorando' : 'ðŸ”´ Parado'}
          </span>
          {stats.timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Última análise: {new Date(stats.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Log de Debug */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Log de Problemas</h4>
          {debugLog.length > 0 && (
            <button
              onClick={clearDebugLog}
              className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaTrash className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        {debugLog.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaBug className="mx-auto mb-2 text-3xl opacity-50" />
            <p>Nenhum problema detectado</p>
            <p className="text-sm">
              {isMonitoring ? 'Monitoramento ativo...' : 'Inicie o monitoramento para detectar problemas'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {debugLog.map((entry) => (
              <div key={entry.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    âš ï¸ Problema Detectado
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {entry.duplicates.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      ðŸ”„ Duplicatas encontradas: {entry.duplicates.length}
                    </p>
                    {entry.duplicates.slice(0, 3).map((dup, idx) => (
                      <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                        â€¢ "{dup.duplicate.title}" (intervalo: {dup.timeDiff.toFixed(1)}s)
                      </p>
                    ))}
                  </div>
                )}
                
                {entry.frequent.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      ðŸš¨ NotificaÃ§Ãµes frequentes: {entry.frequent.length} tipos
                    </p>
                    {entry.frequent.slice(0, 3).map((freq, idx) => (
                      <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                        â€¢ {freq.key}: {freq.count} vezes
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDebugger;
