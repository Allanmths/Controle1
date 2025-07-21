import React, { useState } from 'react';
import { 
  FaUsers, 
  FaSearch, 
  FaEdit, 
  FaToggleOn, 
  FaToggleOff, 
  FaShieldAlt,
  FaCrown,
  FaUserEdit,
  FaUser,
  FaEye,
  FaChartBar,
  FaTrash
} from 'react-icons/fa';
import { useUserManagement } from '../hooks/useUserManagement';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_DESCRIPTIONS, hasPermission, PERMISSIONS } from '../utils/permissions';
import UserEditModal from './UserEditModal';
import DeleteUserModal from './DeleteUserModal';
import SkeletonLoader from './SkeletonLoader';
import toast from 'react-hot-toast';

const UserRoleManager = () => {
  const { userData, currentUser } = useAuth();
  const { 
    users, 
    loading, 
    updateUserRole, 
    updateUserPermissions, 
    toggleUserStatus,
    deleteUser,
    searchUsers,
    getUserStats
  } = useUserManagement();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar se o usuário atual pode gerenciar usuários
  const canManageUsers = hasPermission(userData?.role, PERMISSIONS.MANAGE_USERS);
  const canDeleteUsers = hasPermission(userData?.role, PERMISSIONS.DELETE_USERS);

  // Filtrar usuários baseado na busca e role
  React.useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (userId, userData) => {
    // Atualizar role
    await updateUserRole(userId, userData.role);
    
    // Atualizar permissões customizadas se houver
    if (userData.customPermissions) {
      await updateUserPermissions(userId, userData.customPermissions);
    }
    
    // Atualizar status ativo/inativo
    await toggleUserStatus(userId, userData.isActive);
  };

  const handleDeleteUser = (user) => {
    // Verificar se não é o próprio usuário
    if (user.id === currentUser?.uid) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }
    
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (userId) => {
    setIsDeleting(true);
    const success = await deleteUser(userId);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
    
    setIsDeleting(false);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.ADMIN: return <FaCrown className="text-purple-600" />;
      case ROLES.MANAGER: return <FaShieldAlt className="text-blue-600" />;
      case ROLES.EDITOR: return <FaUserEdit className="text-green-600" />;
      case ROLES.USER: return <FaUser className="text-yellow-600" />;
      case ROLES.VIEWER: return <FaEye className="text-gray-600" />;
      default: return <FaUser className="text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN: return 'bg-purple-100 text-purple-800';
      case ROLES.MANAGER: return 'bg-blue-100 text-blue-800';
      case ROLES.EDITOR: return 'bg-green-100 text-green-800';
      case ROLES.USER: return 'bg-yellow-100 text-yellow-800';
      case ROLES.VIEWER: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getUserStats();

  if (!canManageUsers) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Acesso Negado
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Você não tem permissão para gerenciar usuários do sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaUsers className="text-2xl text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
            <p className="text-gray-600">Gerencie roles e permissões dos usuários do sistema</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <FaUsers className="text-3xl text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <FaToggleOn className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuários Inativos</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <FaToggleOff className="text-3xl text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-purple-600">{stats.byRole[ROLES.ADMIN] || 0}</p>
            </div>
            <FaCrown className="text-3xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os Roles</option>
            {Object.entries(ROLES).map(([key, value]) => (
              <option key={key} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonLoader rows={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FaUser className="text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'Nome não definido'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </span>
                      </div>
                      {user.customPermissions && user.customPermissions.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          +{user.customPermissions.length} permissões customizadas
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAtFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                          title="Editar usuário"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, !user.isActive)}
                          className={`p-2 rounded-full transition-colors ${
                            user.isActive !== false
                              ? 'text-red-600 hover:text-red-900 hover:bg-red-100'
                              : 'text-green-600 hover:text-green-900 hover:bg-green-100'
                          }`}
                          title={user.isActive !== false ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {user.isActive !== false ? <FaToggleOff /> : <FaToggleOn />}
                        </button>
                        {user.id !== currentUser?.uid && canDeleteUsers && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                            title="Excluir usuário"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-12">
                <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedRole 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Não há usuários cadastrados no sistema'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />

      {/* Modal de Exclusão */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={userToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default UserRoleManager;
