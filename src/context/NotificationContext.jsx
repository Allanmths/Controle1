import React, { createContext, useContext, useEffect, useState } from 'react';
import { FaBell, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar notificaÃ§Ãµes do localStorage
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Erro ao carregar notificaÃ§Ãµes:', error);
    }
  }, []);

  // Salvar notificaÃ§Ãµes no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
      setUnreadCount(notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao salvar notificaÃ§Ãµes:', error);
    }
  }, [notifications]);

  // Adicionar nova notificaÃ§Ã£o
  const addNotification = (notification) => {
    // Verificar duplicatas recentes (Ãºltima hora) para notificaÃ§Ãµes de estoque
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hora em milliseconds
    
    if (notification.category === 'stock' && notification.productId) {
      const isDuplicate = notifications.some(existing => {
        const existingTime = new Date(existing.timestamp).getTime();
        return (
          existing.category === 'stock' &&
          existing.productId === notification.productId &&
          existing.type === notification.type &&
          existingTime > oneHourAgo
        );
      });
      
      if (isDuplicate) {
        console.log('NotificaÃ§Ã£o duplicada ignorada:', notification);
        return null; // NÃ£o adicionar duplicata
      }
    }

    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // MÃ¡ximo 50 notificaÃ§Ãµes

    // Mostrar toast se especificado
    if (notification.showToast !== false) {
      const toastOptions = {
        duration: notification.duration || 4000,
        icon: getNotificationIcon(notification.type),
      };

      switch (notification.type) {
        case 'success':
          toast.success(notification.message, toastOptions);
          break;
        case 'warning':
          toast.error(notification.message, toastOptions);
          break;
        case 'error':
          toast.error(notification.message, toastOptions);
          break;
        default:
          toast(notification.message, toastOptions);
      }
    }

    return newNotification.id;
  };

  // Marcar notificaÃ§Ã£o como lida
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Remover notificaÃ§Ã£o
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Limpar todas as notificaÃ§Ãµes
  const clearAll = () => {
    setNotifications([]);
  };

  // NotificaÃ§Ãµes especÃ­ficas do sistema
  const notifyLowStock = (product, currentStock) => {
    return addNotification({
      type: 'warning',
      title: `Estoque Baixo - ${product.name}`,
      message: `${product.name} estÃ¡ com estoque baixo: ${currentStock} unidades`,
      action: {
        label: 'Ver Produto',
        href: `/stock?search=${encodeURIComponent(product.name)}`
      },
      category: 'stock',
      productId: product.id,
      productName: product.name
    });
  };

  const notifyOutOfStock = (product) => {
    return addNotification({
      type: 'error',
      title: `Produto Sem Estoque - ${product.name}`,
      message: `${product.name} estÃ¡ sem estoque!`,
      action: {
        label: 'Repor Estoque',
        href: `/stock?search=${encodeURIComponent(product.name)}`
      },
      category: 'stock',
      productId: product.id,
      productName: product.name
    });
  };

  const notifyStockMovement = (type, product, quantity, location) => {
    const typeLabels = {
      entrada: 'Entrada',
      saida: 'SaÃ­da',
      transfer: 'TransferÃªncia'
    };

    return addNotification({
      type: 'info',
      title: `${typeLabels[type]} de Estoque - ${product.name}`,
      message: `${quantity} unidades de ${product.name} - ${location}`,
      action: {
        label: 'Ver MovimentaÃ§Ãµes',
        href: '/movements'
      },
      showToast: false, // NÃ£o mostrar toast para movimentaÃ§Ãµes
      category: 'movement',
      productId: product.id,
      productName: product.name
    });
  };

  const notifyBackupCompleted = (itemCount) => {
    return addNotification({
      type: 'success',
      title: 'Backup ConcluÃ­do',
      message: `Backup realizado com sucesso! ${itemCount} itens salvos.`,
      action: {
        label: 'Ver ConfiguraÃ§Ãµes',
        href: '/settings'
      },
      category: 'system'
    });
  };

  const notifyUserAction = (action, target, user) => {
    return addNotification({
      type: 'info',
      title: 'AÃ§Ã£o do UsuÃ¡rio',
      message: `${user} ${action} ${target}`,
      showToast: false,
      category: 'audit'
    });
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    // Helpers especÃ­ficos
    notifyLowStock,
    notifyOutOfStock,
    notifyStockMovement,
    notifyBackupCompleted,
    notifyUserAction
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper para Ã­cones
const getNotificationIcon = (type) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" />,
    warning: <FaExclamationTriangle className="text-yellow-500" />,
    error: <FaExclamationTriangle className="text-red-500" />,
    info: <FaInfoCircle className="text-blue-500" />
  };
  return icons[type] || <FaBell className="text-gray-500" />;
};
