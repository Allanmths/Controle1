// Permissões específicas para sistema de reposição
export const REPLENISHMENT_PERMISSIONS = {
  // Solicitações
  REQUEST_REPLENISHMENT: 'request_replenishment',
  VIEW_ALL_REQUESTS: 'view_all_requests',
  
  // Aprovações
  APPROVE_REPLENISHMENT: 'approve_replenishment',
  REJECT_REPLENISHMENT: 'reject_replenishment',
  
  // Execução
  EXECUTE_REPLENISHMENT: 'execute_replenishment',
  
  // Lista de Compras
  GENERATE_PURCHASE_LIST: 'generate_purchase_list',
  EXPORT_PURCHASE_LIST: 'export_purchase_list',
  
  // Relatórios
  VIEW_REPLENISHMENT_REPORTS: 'view_replenishment_reports',
  EXPORT_REPLENISHMENT_REPORTS: 'export_replenishment_reports'
};

// Status das solicitações de reposição
export const REPLENISHMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Prioridades
export const REPLENISHMENT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Status da lista de compras
export const PURCHASE_LIST_STATUS = {
  GENERATED: 'generated',
  REVIEWED: 'reviewed',
  SENT_TO_SUPPLIER: 'sent_to_supplier',
  RECEIVED: 'received',
  COMPLETED: 'completed'
};

// Descrições dos status
export const STATUS_DESCRIPTIONS = {
  [REPLENISHMENT_STATUS.PENDING]: 'Aguardando aprovação',
  [REPLENISHMENT_STATUS.APPROVED]: 'Aprovado - Aguardando execução',
  [REPLENISHMENT_STATUS.REJECTED]: 'Rejeitado',
  [REPLENISHMENT_STATUS.IN_PROGRESS]: 'Em execução',
  [REPLENISHMENT_STATUS.COMPLETED]: 'Concluído',
  [REPLENISHMENT_STATUS.CANCELLED]: 'Cancelado'
};

// Cores dos status
export const STATUS_COLORS = {
  [REPLENISHMENT_STATUS.PENDING]: 'yellow',
  [REPLENISHMENT_STATUS.APPROVED]: 'green',
  [REPLENISHMENT_STATUS.REJECTED]: 'red',
  [REPLENISHMENT_STATUS.IN_PROGRESS]: 'blue',
  [REPLENISHMENT_STATUS.COMPLETED]: 'gray',
  [REPLENISHMENT_STATUS.CANCELLED]: 'gray'
};

// Configurações padrão do sistema
export const REPLENISHMENT_CONFIG = {
  // Limites de aprovação automática
  AUTO_APPROVE_LIMIT: 1000, // Valor em R$
  
  // Configurações de estoque baixo
  DEFAULT_MIN_STOCK_PERCENTAGE: 20, // 20% do estoque máximo
  CRITICAL_STOCK_PERCENTAGE: 10,    // 10% = crítico
  
  // Configurações de notificação
  NOTIFICATION_SETTINGS: {
    NOTIFY_ON_REQUEST: true,
    NOTIFY_ON_APPROVAL: true,
    NOTIFY_ON_REJECTION: true,
    NOTIFY_ON_EXECUTION: true,
    NOTIFY_LOW_STOCK: true
  }
};
