import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useUserActionNotifications } from '../hooks/useNotificationHelpers';

const NotificationDemo = () => {
  const { addNotification } = useNotifications();
  const { 
    notifyProductAdded, 
    notifyProductUpdated, 
    notifyStockAdjustment,
    notifyTransferCompleted,
    notifyBackupCreated 
  } = useUserActionNotifications();

  const demoNotifications = [
    {
      title: 'NotificaÃ§Ã£o de Sucesso',
      action: () => addNotification({
        type: 'success',
        title: 'OperaÃ§Ã£o ConcluÃ­da',
        message: 'A operaÃ§Ã£o foi executada com sucesso!',
        action: {
          label: 'Ver Dashboard',
          href: '/'
        }
      })
    },
    {
      title: 'Alerta de Estoque Baixo',
      action: () => addNotification({
        type: 'warning',
        title: 'Estoque Baixo - Cerveja Heineken',
        message: 'O produto "Cerveja Heineken" estÃ¡ com estoque baixo (3 unidades restantes)',
        action: {
          label: 'Ver Produto',
          href: '/stock?search=Cerveja Heineken'
        },
        category: 'stock',
        productId: 'demo_product_1',
        productName: 'Cerveja Heineken'
      })
    },
    {
      title: 'Produto Sem Estoque',
      action: () => addNotification({
        type: 'error',
        title: 'Produto Sem Estoque - Vodka Absolut',
        message: 'Vodka Absolut estÃ¡ sem estoque!',
        action: {
          label: 'Repor Estoque',
          href: '/stock?search=Vodka Absolut'
        },
        category: 'stock',
        productId: 'demo_product_2',
        productName: 'Vodka Absolut'
      })
    },
    {
      title: 'MovimentaÃ§Ã£o de Estoque',
      action: () => addNotification({
        type: 'info',
        title: 'Transferência de Estoque - Whisky',
        message: '15 unidades de Whisky Johnnie Walker transferidas',
        action: {
          label: 'Ver Movimentações',
          href: '/movements'
        },
        category: 'movement',
        productId: 'demo_product_3',
        productName: 'Whisky Johnnie Walker'
      })
    },
    {
      title: 'Backup do Sistema',
      action: () => addNotification({
        type: 'success',
        title: 'Backup ConcluÃ­do',
        message: 'Backup dos dados criado com sucesso! 150 itens salvos.',
        action: {
          label: 'Ver ConfiguraÃ§Ãµes',
          href: '/settings'
        },
        category: 'system'
      })
    },
    {
      title: 'Novo Relatório',
      action: () => addNotification({
        type: 'info',
        title: 'Relatório Disponível',
        message: 'Novo relatório mensal de vendas está pronto para visualização',
        action: {
          label: 'Ver Relatórios',
          href: '/reports'
        },
        category: 'reports'
      })
    },
    {
      title: 'Erro de SincronizaÃ§Ã£o',
      action: () => addNotification({
        type: 'error',
        title: 'Falha na SincronizaÃ§Ã£o',
        message: 'NÃ£o foi possÃ­vel sincronizar com o servidor. Verifique sua conexÃ£o.',
        action: {
          label: 'Tentar Novamente',
          href: '/settings'
        },
        category: 'system'
      })
    },
    {
      title: 'Contagem Finalizada',
      action: () => addNotification({
        type: 'success',
        title: 'Contagem ConcluÃ­da',
        message: 'Contagem de estoque "Mensal Janeiro" finalizada com 89 itens',
        action: {
          label: 'Ver Contagem',
          href: '/counting'
        },
        category: 'counting'
      })
    }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        ðŸ”” DemonstraÃ§Ã£o do Sistema de NotificaÃ§Ãµes
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {demoNotifications.map((demo, index) => (
          <button
            key={index}
            onClick={demo.action}
            className="p-3 text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {demo.title}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          âœ¨ Funcionalidades Implementadas:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>â€¢ <strong>NotificaÃ§Ãµes AutomÃ¡ticas:</strong> Estoque baixo, produtos zerados</li>
          <li>â€¢ <strong>NotificaÃ§Ãµes de AÃ§Ãµes:</strong> Produtos adicionados, editados, removidos</li>
          <li>â€¢ <strong>Redirecionamento Inteligente:</strong> Clique para navegar automaticamente</li>
          <li>â€¢ <strong>PersistÃªncia:</strong> NotificaÃ§Ãµes salvas no localStorage</li>
          <li>â€¢ <strong>InteraÃ§Ãµes:</strong> Marcar como lida, remover, limpar todas</li>
          <li>â€¢ <strong>IntegraÃ§Ã£o:</strong> Toast para feedback imediato</li>
          <li>â€¢ <strong>Design Responsivo:</strong> Funciona em todos os dispositivos</li>
          <li>â€¢ <strong>Tema Escuro:</strong> Suporte completo ao modo escuro</li>
          <li>â€¢ <strong>CategorizaÃ§Ã£o:</strong> Diferentes tipos por contexto (estoque, sistema, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationDemo;
