import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaCheck, FaTrash, FaEye } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    const baseClasses = "w-4 h-4";
    switch (type) {
      case 'success':
        return <FaCheck className={`${baseClasses} text-green-500`} />;
      case 'warning':
        return <FaBell className={`${baseClasses} text-yellow-500`} />;
      case 'error':
        return <FaBell className={`${baseClasses} text-red-500`} />;
      default:
        return <FaBell className={`${baseClasses} text-blue-500`} />;
    }
  };

  const handleNotificationClick = (notification) => {
    // Marcar como lida se nÃ£o foi lida ainda
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Fechar o dropdown
    setIsOpen(false);
    
    // LÃ³gica de redirecionamento baseada no tipo e categoria
    if (notification.action?.href) {
      // Se tem URL especÃ­fica definida
      if (notification.action.href.startsWith('http')) {
        // URL externa
        window.open(notification.action.href, '_blank');
      } else {
        // Rota interna
        navigate(notification.action.href);
      }
    } else if (notification.category === 'stock' && notification.productId) {
      // NotificaÃ§Ãµes de estoque - ir para pÃ¡gina de estoque com busca do produto
      navigate(`/stock?search=${encodeURIComponent(notification.title.replace('Produto ', '').replace(' estÃ¡', ''))}`);
    } else if (notification.category === 'movement' && notification.productId) {
      // NotificaÃ§Ãµes de movimento - ir para pÃ¡gina de movimentaÃ§Ãµes
      navigate('/movements');
    } else if (notification.category === 'system') {
      // NotificaÃ§Ãµes de sistema - ir para configuraÃ§Ãµes
      navigate('/settings');
    } else {
      // Default - ir para dashboard
      navigate('/');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BotÃ£o de NotificaÃ§Ãµes */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de NotificaÃ§Ãµes */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              NotificaÃ§Ãµes
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista de NotificaÃ§Ãµes */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FaBell className="mx-auto mb-3 text-3xl opacity-50" />
                <p>Nenhuma notificaÃ§Ã£o</p>
                <p className="text-sm">VocÃª estÃ¡ em dia!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  } ${notification.action ? 'hover:shadow-sm' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  title={notification.action ? `Clique para: ${notification.action.label}` : 'Clique para marcar como lida'}
                >
                  <div className="flex items-start gap-3">
                    {/* Ãcone */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* ConteÃºdo */}
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
                          
                          {/* AÃ§Ã£o */}
                          {notification.action && (
                            <div className="flex items-center gap-2 mt-2">
                              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                {notification.action.label}
                              </button>
                              <span className="text-xs text-gray-400">â€¢ Clique para navegar</span>
                            </div>
                          )}
                        </div>

                        {/* AÃ§Ãµes */}
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Marcar como lida"
                            >
                              <FaEye className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Remover"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={clearAll}
                className="w-full text-sm text-red-600 dark:text-red-400 hover:underline flex items-center justify-center gap-2"
              >
                <FaTrash className="w-3 h-3" />
                Limpar todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
