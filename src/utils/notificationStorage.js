// UtilitÃ¡rio para acessar e gerenciar o histÃ³rico de notificaÃ§Ãµes

export const NotificationStorage = {
  // Chave do localStorage
  STORAGE_KEY: 'notifications',

  // Obter todas as notificaÃ§Ãµes
  getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao ler notificaÃ§Ãµes do localStorage:', error);
      return [];
    }
  },

  // Salvar notificaÃ§Ãµes
  save(notifications) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
      return true;
    } catch (error) {
      console.error('Erro ao salvar notificaÃ§Ãµes no localStorage:', error);
      return false;
    }
  },

  // Limpar todas as notificaÃ§Ãµes
  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao limpar notificaÃ§Ãµes:', error);
      return false;
    }
  },

  // Obter estatÃ­sticas
  getStats() {
    const notifications = this.getAll();
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = total - unread;
    
    // Contar por tipo
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {});

    // Contar por categoria
    const byCategory = notifications.reduce((acc, n) => {
      const category = n.category || 'Geral';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Contar por data (Ãºltimos 7 dias)
    const last7Days = {};
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      last7Days[key] = 0;
    }

    notifications.forEach(n => {
      const date = new Date(n.timestamp).toISOString().split('T')[0];
      if (last7Days.hasOwnProperty(date)) {
        last7Days[date]++;
      }
    });

    return {
      total,
      unread,
      read,
      byType,
      byCategory,
      last7Days,
      oldestNotification: notifications.length > 0 ? notifications[notifications.length - 1].timestamp : null,
      newestNotification: notifications.length > 0 ? notifications[0].timestamp : null
    };
  },

  // Exportar histÃ³rico
  export() {
    const notifications = this.getAll();
    const stats = this.getStats();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      summary: stats,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read,
        category: n.category,
        productId: n.productId,
        action: n.action
      }))
    };

    return exportData;
  },

  // Importar histÃ³rico
  import(data) {
    try {
      if (data.notifications && Array.isArray(data.notifications)) {
        this.save(data.notifications);
        return { success: true, imported: data.notifications.length };
      }
      return { success: false, error: 'Formato de dados invÃ¡lido' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Buscar notificaÃ§Ãµes
  search(query, filters = {}) {
    const notifications = this.getAll();
    const queryLower = query.toLowerCase();

    return notifications.filter(n => {
      // Filtro por texto
      const matchesText = !query || 
        n.title.toLowerCase().includes(queryLower) ||
        n.message.toLowerCase().includes(queryLower);

      // Filtro por tipo
      const matchesType = !filters.type || n.type === filters.type;

      // Filtro por status
      const matchesStatus = !filters.status || 
        (filters.status === 'read' && n.read) ||
        (filters.status === 'unread' && !n.read);

      // Filtro por categoria
      const matchesCategory = !filters.category || n.category === filters.category;

      // Filtro por data
      let matchesDate = true;
      if (filters.dateFrom || filters.dateTo) {
        const notificationDate = new Date(n.timestamp);
        if (filters.dateFrom) {
          matchesDate = notificationDate >= new Date(filters.dateFrom);
        }
        if (filters.dateTo && matchesDate) {
          matchesDate = notificationDate <= new Date(filters.dateTo);
        }
      }

      return matchesText && matchesType && matchesStatus && matchesCategory && matchesDate;
    });
  },

  // Limpar notificaÃ§Ãµes antigas (mais de X dias)
  cleanOldNotifications(daysToKeep = 30) {
    const notifications = this.getAll();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredNotifications = notifications.filter(n => {
      return new Date(n.timestamp) >= cutoffDate;
    });

    const removedCount = notifications.length - filteredNotifications.length;
    this.save(filteredNotifications);

    return { removedCount, remaining: filteredNotifications.length };
  }
};

// Hook para usar o storage de notificaÃ§Ãµes
export const useNotificationStorage = () => {
  return NotificationStorage;
};
