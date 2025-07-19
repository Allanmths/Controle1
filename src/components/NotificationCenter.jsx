import React, { useState, useEffect } from 'react';
import { FaCheck, FaExclamationTriangle, FaInfo, FaTimes, FaBell } from 'react-icons/fa';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const addNotification = (notification) => {
        const id = Date.now();
        const newNotification = {
            id,
            timestamp: new Date(),
            read: false,
            ...notification
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Auto remove após 5 segundos se for temporária
        if (notification.autoRemove !== false) {
            setTimeout(() => {
                removeNotification(id);
            }, 5000);
        }
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsRead = (id) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        // Simular notificações do sistema (ex: estoque baixo, vendas, etc.)
        const checkSystemNotifications = () => {
            // Aqui você pode integrar com seus dados reais
            // Por exemplo, verificar estoque baixo, produtos vencendo, etc.
        };

        const interval = setInterval(checkSystemNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <FaCheck className="text-green-500" />;
            case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
            case 'error': return <FaTimes className="text-red-500" />;
            default: return <FaInfo className="text-blue-500" />;
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <FaBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border z-50">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold">Notificações</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Limpar todas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FaBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {notification.timestamp.toLocaleTimeString('pt-BR')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(notification.id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <FaTimes className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

// Hook para usar o sistema de notificações
export const useNotifications = () => {
    const [notificationComponent, setNotificationComponent] = useState(null);

    const showNotification = (notification) => {
        // Esta função seria chamada para adicionar notificações
        // Implementação dependeria de como você quer gerenciar o estado global
        console.log('Nova notificação:', notification);
    };

    return { showNotification };
};

export default NotificationCenter;
