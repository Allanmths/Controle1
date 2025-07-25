﻿import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { ROLES } from '../utils/permissions';
import toast from 'react-hot-toast';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  // Carregar usuÃ¡rios em tempo real
  useEffect(() => {
    setLoading(true);
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastLoginFormatted: doc.data().lastLogin ? 
          new Date(doc.data().lastLogin.toDate()).toLocaleString('pt-BR') : 
          'Nunca',
        createdAtFormatted: doc.data().createdAt ? 
          new Date(doc.data().createdAt.toDate()).toLocaleDateString('pt-BR') : 
          'N/A'
      }));
      
      setUsers(usersData);
      setTotalUsers(usersData.length);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar usuÃ¡rios:', error);
      toast.error('Erro ao carregar usuÃ¡rios');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Atualizar role do usuÃ¡rio
  const updateUserRole = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });
      
      toast.success('Role atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role do usuÃ¡rio');
      return false;
    }
  };

  // Atualizar permissÃµes customizadas do usuÃ¡rio
  const updateUserPermissions = async (userId, customPermissions) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        customPermissions: customPermissions,
        updatedAt: new Date()
      });
      
      toast.success('PermissÃµes atualizadas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar permissÃµes:', error);
      toast.error('Erro ao atualizar permissÃµes do usuÃ¡rio');
      return false;
    }
  };

  // Ativar/desativar usuÃ¡rio
  const toggleUserStatus = async (userId, isActive) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: isActive,
        updatedAt: new Date()
      });
      
      toast.success(`UsuÃ¡rio ${isActive ? 'ativado' : 'desativado'} com sucesso!`);
      return true;
    } catch (error) {
      console.error('Erro ao alterar status do usuÃ¡rio:', error);
      toast.error('Erro ao alterar status do usuÃ¡rio');
      return false;
    }
  };

  // Excluir usuÃ¡rio
  const deleteUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      toast.success('UsuÃ¡rio excluÃ­do com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuÃ¡rio:', error);
      toast.error('Erro ao excluir usuÃ¡rio');
      return false;
    }
  };

  // Buscar usuÃ¡rios por termo
  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      return users;
    }

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const filteredUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return filteredUsers;
    } catch (error) {
      console.error('Erro ao buscar usuÃ¡rios:', error);
      toast.error('Erro ao buscar usuÃ¡rios');
      return [];
    }
  };

  // Obter estatÃ­sticas dos usuÃ¡rios
  const getUserStats = () => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive !== false).length,
      inactive: users.filter(u => u.isActive === false).length,
      byRole: {}
    };

    // Contar usuÃ¡rios por role
    Object.values(ROLES).forEach(role => {
      stats.byRole[role] = users.filter(u => u.role === role).length;
    });

    return stats;
  };

  return {
    users,
    loading,
    totalUsers,
    updateUserRole,
    updateUserPermissions,
    toggleUserStatus,
    deleteUser,
    searchUsers,
    getUserStats
  };
};
