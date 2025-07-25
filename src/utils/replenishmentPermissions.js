// PermissÃµes especÃ­ficas para sistema de reposiÃ§Ã£o
export const REPLENISHMENT_PERMISSIONS = {
  // SolicitaÃ§Ãµes
  REQUEST_REPLENISHMENT: 'request_replenishment',
  VIEW_ALL_REQUESTS: 'view_all_requests',
  
  // AprovaÃ§Ãµes
  APPROVE_REPLENISHMENT: 'approve_replenishment',
  REJECT_REPLENISHMENT: 'reject_replenishment',
  
  // ExecuÃ§Ã£o
  EXECUTE_REPLENISHMENT: 'execute_replenishment',
  
  // Lista de Compras
  GENERATE_PURCHASE_LIST: 'generate_purchase_list',
  EXPORT_PURCHASE_LIST: 'export_purchase_list',
  
  // RelatÃ³rios
  VIEW_REPLENISHMENT_REPORTS: 'view_replenishment_reports',
  EXPORT_REPLENISHMENT_REPORTS: 'export_replenishment_reports'
};

// Status das solicitaÃ§Ãµes de reposiÃ§Ã£o
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

// DescriÃ§Ãµes dos status
export const STATUS_DESCRIPTIONS = {
  [REPLENISHMENT_STATUS.PENDING]: 'Aguardando aprovaÃ§Ã£o',
  [REPLENISHMENT_STATUS.APPROVED]: 'Aprovado - Aguardando execuÃ§Ã£o',
  [REPLENISHMENT_STATUS.REJECTED]: 'Rejeitado',
  [REPLENISHMENT_STATUS.IN_PROGRESS]: 'Em execuÃ§Ã£o',
  [REPLENISHMENT_STATUS.COMPLETED]: 'ConcluÃ­do',
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

// ConfiguraÃ§Ãµes padrÃ£o do sistema
export const REPLENISHMENT_CONFIG = {
  // Limites de aprovaÃ§Ã£o automÃ¡tica
  AUTO_APPROVE_LIMIT: 1000, // Valor em R$
  
  // ConfiguraÃ§Ãµes de estoque baixo
  DEFAULT_MIN_STOCK_PERCENTAGE: 20, // 20% do estoque mÃ¡ximo
  CRITICAL_STOCK_PERCENTAGE: 10,    // 10% = crÃ­tico
  
  // ConfiguraÃ§Ãµes de notificaÃ§Ã£o
  NOTIFICATION_SETTINGS: {
    NOTIFY_ON_REQUEST: true,
    NOTIFY_ON_APPROVAL: true,
    NOTIFY_ON_REJECTION: true,
    NOTIFY_ON_EXECUTION: true,
    NOTIFY_LOW_STOCK: true
  }
};
