// Sistema de permissões e roles

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  EDITOR: 'editor',
  USER: 'user',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // Permissões de produtos
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  VIEW_PRODUCTS: 'view_products',
  
  // Permissões de estoque
  MANAGE_STOCK: 'manage_stock',
  VIEW_STOCK: 'view_stock',
  EXPORT_STOCK: 'export_stock',
  
  // Permissões de movimentações
  CREATE_MOVEMENTS: 'create_movements',
  VIEW_MOVEMENTS: 'view_movements',
  DELETE_MOVEMENTS: 'delete_movements',
  
  // Permissões de relatórios
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // Permissões de configuração
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_LOCATIONS: 'manage_locations',
  MANAGE_SUPPLIERS: 'manage_suppliers',
  
  // Permissões de sistema
  MANAGE_USERS: 'manage_users',
  DELETE_USERS: 'delete_users',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_AUDIT: 'view_audit',
  
  // Permissões de reposição
  REQUEST_REPLENISHMENT: 'request_replenishment',
  VIEW_ALL_REQUESTS: 'view_all_requests',
  APPROVE_REPLENISHMENT: 'approve_replenishment',
  REJECT_REPLENISHMENT: 'reject_replenishment',
  EXECUTE_REPLENISHMENT: 'execute_replenishment',
  
  // Permissões de lista de compras
  GENERATE_PURCHASE_LIST: 'generate_purchase_list',
  EXPORT_PURCHASE_LIST: 'export_purchase_list',
  VIEW_REPLENISHMENT_REPORTS: 'view_replenishment_reports',
  EXPORT_REPLENISHMENT_REPORTS: 'export_replenishment_reports'
};

// Definição de permissões por role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin tem todas as permissões
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.EXPORT_STOCK,
    PERMISSIONS.CREATE_MOVEMENTS,
    PERMISSIONS.VIEW_MOVEMENTS,
    PERMISSIONS.DELETE_MOVEMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_AUDIT,
    // Permissões de reposição para managers
    PERMISSIONS.VIEW_ALL_REQUESTS,
    PERMISSIONS.APPROVE_REPLENISHMENT,
    PERMISSIONS.REJECT_REPLENISHMENT,
    PERMISSIONS.EXECUTE_REPLENISHMENT,
    PERMISSIONS.GENERATE_PURCHASE_LIST,
    PERMISSIONS.EXPORT_PURCHASE_LIST,
    PERMISSIONS.VIEW_REPLENISHMENT_REPORTS,
    PERMISSIONS.EXPORT_REPLENISHMENT_REPORTS
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.CREATE_MOVEMENTS,
    PERMISSIONS.VIEW_MOVEMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_LOCATIONS,
    // Permissões de reposição para editors
    PERMISSIONS.REQUEST_REPLENISHMENT,
    PERMISSIONS.EXECUTE_REPLENISHMENT
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.CREATE_MOVEMENTS,
    PERMISSIONS.VIEW_MOVEMENTS,
    PERMISSIONS.VIEW_REPORTS,
    // Permissões de reposição para users
    PERMISSIONS.REQUEST_REPLENISHMENT
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.VIEW_MOVEMENTS,
    PERMISSIONS.VIEW_REPORTS
  ]
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Acesso total ao sistema, incluindo gerenciamento de usuários',
  [ROLES.MANAGER]: 'Gerenciamento completo de estoque e configurações, exceto usuários',
  [ROLES.EDITOR]: 'Pode editar produtos, categorias e fazer movimentações',
  [ROLES.USER]: 'Pode visualizar dados e fazer movimentações básicas',
  [ROLES.VIEWER]: 'Acesso apenas para visualização de dados'
};

// Função para verificar se o usuário tem uma permissão específica
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// Função para verificar se o usuário tem pelo menos uma das permissões
export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Função para verificar se o usuário tem todas as permissões
export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Função para obter todas as permissões de um role
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// Função para verificar se um role pode gerenciar outro role
export const canManageRole = (currentRole, targetRole) => {
  const hierarchy = {
    [ROLES.ADMIN]: 5,
    [ROLES.MANAGER]: 4,
    [ROLES.EDITOR]: 3,
    [ROLES.USER]: 2,
    [ROLES.VIEWER]: 1
  };
  
  return hierarchy[currentRole] > hierarchy[targetRole];
};
