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
      title: 'Notificação de Sucesso',
      action: () => addNotification({
        type: 'success',
        title: 'Operação Concluída',
        message: 'A operação foi executada com sucesso!',
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
        message: 'O produto "Cerveja Heineken" está com estoque baixo (3 unidades restantes)',
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
        message: 'Vodka Absolut está sem estoque!',
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
      title: 'Movimentação de Estoque',
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
        title: 'Backup Concluído',
        message: 'Backup dos dados criado com sucesso! 150 itens salvos.',
        action: {
          label: 'Ver Configurações',
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
      title: 'Erro de Sincronização',
      action: () => addNotification({
        type: 'error',
        title: 'Falha na Sincronização',
        message: 'Não foi possível sincronizar com o servidor. Verifique sua conexão.',
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
        title: 'Contagem Concluída',
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
        🔔 Demonstração do Sistema de Notificações
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
          ✨ Funcionalidades Implementadas:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• <strong>Notificações Automáticas:</strong> Estoque baixo, produtos zerados</li>
          <li>• <strong>Notificações de Ações:</strong> Produtos adicionados, editados, removidos</li>
          <li>• <strong>Redirecionamento Inteligente:</strong> Clique para navegar automaticamente</li>
          <li>• <strong>Persistência:</strong> Notificações salvas no localStorage</li>
          <li>• <strong>Interações:</strong> Marcar como lida, remover, limpar todas</li>
          <li>• <strong>Integração:</strong> Toast para feedback imediato</li>
          <li>• <strong>Design Responsivo:</strong> Funciona em todos os dispositivos</li>
          <li>• <strong>Tema Escuro:</strong> Suporte completo ao modo escuro</li>
          <li>• <strong>Categorização:</strong> Diferentes tipos por contexto (estoque, sistema, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationDemo;
