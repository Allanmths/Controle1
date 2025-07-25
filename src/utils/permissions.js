// Sistema de permissÃµes e roles

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  EDITOR: 'editor',
  USER: 'user',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // PermissÃµes de produtos
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  VIEW_PRODUCTS: 'view_products',
  
  // PermissÃµes de estoque
  MANAGE_STOCK: 'manage_stock',
  VIEW_STOCK: 'view_stock',
  EXPORT_STOCK: 'export_stock',
  
  // PermissÃµes de movimentaÃ§Ãµes
  CREATE_MOVEMENTS: 'create_movements',
  VIEW_MOVEMENTS: 'view_movements',
  DELETE_MOVEMENTS: 'delete_movements',
  
  // PermissÃµes de relatÃ³rios
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // PermissÃµes de configuraÃ§Ã£o
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_LOCATIONS: 'manage_locations',
  MANAGE_SUPPLIERS: 'manage_suppliers',
  
  // PermissÃµes de sistema
  MANAGE_USERS: 'manage_users',
  DELETE_USERS: 'delete_users',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_AUDIT: 'view_audit',
  
  // PermissÃµes de reposiÃ§Ã£o
  REQUEST_REPLENISHMENT: 'request_replenishment',
  VIEW_ALL_REQUESTS: 'view_all_requests',
  APPROVE_REPLENISHMENT: 'approve_replenishment',
  REJECT_REPLENISHMENT: 'reject_replenishment',
  EXECUTE_REPLENISHMENT: 'execute_replenishment',
  
  // PermissÃµes de lista de compras
  GENERATE_PURCHASE_LIST: 'generate_purchase_list',
  EXPORT_PURCHASE_LIST: 'export_purchase_list',
  VIEW_REPLENISHMENT_REPORTS: 'view_replenishment_reports',
  EXPORT_REPLENISHMENT_REPORTS: 'export_replenishment_reports'
};

// DefiniÃ§Ã£o de permissÃµes por role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin tem todas as permissÃµes
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
    // PermissÃµes de reposiÃ§Ã£o para managers
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
    // PermissÃµes de reposiÃ§Ã£o para editors
    PERMISSIONS.REQUEST_REPLENISHMENT,
    PERMISSIONS.EXECUTE_REPLENISHMENT
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.CREATE_MOVEMENTS,
    PERMISSIONS.VIEW_MOVEMENTS,
    PERMISSIONS.VIEW_REPORTS,
    // PermissÃµes de reposiÃ§Ã£o para users
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
  [ROLES.ADMIN]: 'Acesso total ao sistema, incluindo gerenciamento de usuÃ¡rios',
  [ROLES.MANAGER]: 'Gerenciamento completo de estoque e configuraÃ§Ãµes, exceto usuÃ¡rios',
  [ROLES.EDITOR]: 'Pode editar produtos, categorias e fazer movimentaÃ§Ãµes',
  [ROLES.USER]: 'Pode visualizar dados e fazer movimentaÃ§Ãµes bÃ¡sicas',
  [ROLES.VIEWER]: 'Acesso apenas para visualizaÃ§Ã£o de dados'
};

// FunÃ§Ã£o para verificar se o usuÃ¡rio tem uma permissÃ£o especÃ­fica
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// FunÃ§Ã£o para verificar se o usuÃ¡rio tem pelo menos uma das permissÃµes
export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

// FunÃ§Ã£o para verificar se o usuÃ¡rio tem todas as permissÃµes
export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

// FunÃ§Ã£o para obter todas as permissÃµes de um role
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// FunÃ§Ã£o para verificar se um role pode gerenciar outro role
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
