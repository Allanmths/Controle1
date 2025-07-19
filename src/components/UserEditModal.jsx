import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaShieldAlt, FaCheck, FaTimes as FaTimesIcon } from 'react-icons/fa';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, ROLE_DESCRIPTIONS, getRolePermissions } from '../utils/permissions';

const UserEditModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: ROLES.VIEWER,
    isActive: true,
    customPermissions: []
  });
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);
  const [loading, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        role: user.role || ROLES.VIEWER,
        isActive: user.isActive !== false,
        customPermissions: user.customPermissions || []
      });
      setShowCustomPermissions(user.customPermissions && user.customPermissions.length > 0);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.id, formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
    setSaving(false);
  };

  const handlePermissionToggle = (permission) => {
    const currentPermissions = formData.customPermissions || [];
    const hasPermission = currentPermissions.includes(permission);
    
    let newPermissions;
    if (hasPermission) {
      newPermissions = currentPermissions.filter(p => p !== permission);
    } else {
      newPermissions = [...currentPermissions, permission];
    }
    
    setFormData(prev => ({ ...prev, customPermissions: newPermissions }));
  };

  const getRolePermissionsList = () => {
    return getRolePermissions(formData.role);
  };

  const hasRolePermission = (permission) => {
    return getRolePermissionsList().includes(permission);
  };

  const hasCustomPermission = (permission) => {
    return formData.customPermissions?.includes(permission) || false;
  };

  const getPermissionStatus = (permission) => {
    const roleHas = hasRolePermission(permission);
    const customHas = hasCustomPermission(permission);
    
    if (roleHas && customHas) return 'both';
    if (roleHas) return 'role';
    if (customHas) return 'custom';
    return 'none';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FaUser className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Editar Usuário</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role do Sistema
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {ROLE_DESCRIPTIONS[formData.role]}
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                </label>
                <p className="text-xs text-gray-600 ml-6">
                  Desmarque para desativar o acesso do usuário
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showCustomPermissions}
                    onChange={(e) => setShowCustomPermissions(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Permissões Customizadas</span>
                </label>
                <p className="text-xs text-gray-600 ml-6">
                  Adicione ou remova permissões específicas além do role padrão
                </p>
              </div>
            </div>

            {/* Permissões */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Sistema de Permissões</h3>
              </div>

              {/* Legenda */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Legenda:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <FaCheck className="text-blue-600" />
                    <span>Permissão do Role</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaCheck className="text-green-600" />
                    <span>Permissão Customizada</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaCheck className="text-purple-600" />
                    <span>Role + Custom</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaTimesIcon className="text-gray-400" />
                    <span>Sem Permissão</span>
                  </div>
                </div>
              </div>

              {/* Lista de Permissões */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                {Object.entries(PERMISSIONS).map(([key, permission]) => {
                  const status = getPermissionStatus(permission);
                  
                  return (
                    <div key={permission} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex-1">
                        <span className="text-sm text-gray-900">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Status do Role */}
                        <div className="text-xs text-gray-600 w-16 text-center">
                          {hasRolePermission(permission) ? (
                            <FaCheck className="text-blue-600 mx-auto" />
                          ) : (
                            <FaTimesIcon className="text-gray-300 mx-auto" />
                          )}
                        </div>
                        
                        {/* Toggle Permissão Customizada */}
                        {showCustomPermissions && (
                          <button
                            onClick={() => handlePermissionToggle(permission)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              hasCustomPermission(permission)
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {hasCustomPermission(permission) ? <FaCheck size={12} /> : <FaTimesIcon size={12} />}
                          </button>
                        )}
                        
                        {/* Status Final */}
                        <div className="w-6 flex justify-center">
                          {status !== 'none' && (
                            <FaCheck 
                              className={
                                status === 'both' ? 'text-purple-600' :
                                status === 'role' ? 'text-blue-600' :
                                'text-green-600'
                              } 
                              size={14}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
