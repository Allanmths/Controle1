import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const useReplenishmentManagement = () => {
  const { currentUser, userData } = useAuth();
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar solicitações de reposição
  const fetchReplenishmentRequests = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      let q = collection(db, 'replenishmentRequests');
      
      // Aplicar filtros
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.requestedBy) {
        q = query(q, where('requestedBy', '==', filters.requestedBy));
      }
      
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }

      // Ordenar por data de criação (mais recentes primeiro)
      q = query(q, orderBy('requestDate', 'desc'));

      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRequests(requestsData);
      return requestsData;
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      setError('Erro ao carregar solicitações de reposição');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Criar nova solicitação de reposição
  const createReplenishmentRequest = async (requestData) => {
    setLoading(true);
    setError(null);

    try {
      const newRequest = {
        ...requestData,
        requestedBy: currentUser.uid,
        requestedByName: userData?.displayName || currentUser.email,
        requestDate: Timestamp.now(),
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'replenishmentRequests'), newRequest);
      
      // Notificar gestores sobre nova solicitação
      addNotification({
        type: 'info',
        title: 'Nova Solicitação de Reposição',
        message: `${userData?.displayName || currentUser.email} criou uma solicitação de reposição`,
        action: {
          label: 'Ver Solicitação',
          route: `/replenishment/requests/${docRef.id}`
        }
      });

      await fetchReplenishmentRequests();
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      setError('Erro ao criar solicitação de reposição');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Aprovar solicitação
  const approveRequest = async (requestId, approvalData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const requestRef = doc(db, 'replenishmentRequests', requestId);
      
      const updateData = {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedByName: userData?.displayName || currentUser.email,
        approvalDate: Timestamp.now(),
        approvalNotes: approvalData.notes || '',
        updatedAt: Timestamp.now()
      };

      await updateDoc(requestRef, updateData);

      // Notificar solicitante
      const request = requests.find(r => r.id === requestId);
      if (request) {
        addNotification({
          type: 'success',
          title: 'Solicitação Aprovada',
          message: `Sua solicitação de reposição foi aprovada por ${userData?.displayName || currentUser.email}`,
          targetUserId: request.requestedBy,
          action: {
            label: 'Ver Detalhes',
            route: `/replenishment/execute/${requestId}`
          }
        });
      }

      await fetchReplenishmentRequests();
      return true;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      setError('Erro ao aprovar solicitação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Rejeitar solicitação
  const rejectRequest = async (requestId, rejectionData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const requestRef = doc(db, 'replenishmentRequests', requestId);
      
      const updateData = {
        status: 'rejected',
        rejectedBy: currentUser.uid,
        rejectedByName: userData?.displayName || currentUser.email,
        rejectionDate: Timestamp.now(),
        rejectionReason: rejectionData.reason || '',
        rejectionNotes: rejectionData.notes || '',
        updatedAt: Timestamp.now()
      };

      await updateDoc(requestRef, updateData);

      // Notificar solicitante
      const request = requests.find(r => r.id === requestId);
      if (request) {
        addNotification({
          type: 'warning',
          title: 'Solicitação Rejeitada',
          message: `Sua solicitação de reposição foi rejeitada. Motivo: ${rejectionData.reason || 'Não informado'}`,
          targetUserId: request.requestedBy
        });
      }

      await fetchReplenishmentRequests();
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      setError('Erro ao rejeitar solicitação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Executar reposição
  const executeReplenishment = async (requestId, executionData) => {
    setLoading(true);
    setError(null);

    try {
      const requestRef = doc(db, 'replenishmentRequests', requestId);
      
      const updateData = {
        status: 'completed',
        executedBy: currentUser.uid,
        executedByName: userData?.displayName || currentUser.email,
        executionDate: Timestamp.now(),
        executionData: executionData,
        updatedAt: Timestamp.now()
      };

      await updateDoc(requestRef, updateData);

      // Notificar gestor sobre conclusão
      const request = requests.find(r => r.id === requestId);
      if (request && request.approvedBy) {
        addNotification({
          type: 'success',
          title: 'Reposição Concluída',
          message: `A reposição foi executada por ${userData?.displayName || currentUser.email}`,
          targetUserId: request.approvedBy
        });
      }

      await fetchReplenishmentRequests();
      return true;
    } catch (error) {
      console.error('Erro ao executar reposição:', error);
      setError('Erro ao executar reposição');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cancelar solicitação
  const cancelRequest = async (requestId, reason = '') => {
    setLoading(true);
    setError(null);

    try {
      const requestRef = doc(db, 'replenishmentRequests', requestId);
      
      const updateData = {
        status: 'cancelled',
        cancelledBy: currentUser.uid,
        cancelledByName: userData?.displayName || currentUser.email,
        cancellationDate: Timestamp.now(),
        cancellationReason: reason,
        updatedAt: Timestamp.now()
      };

      await updateDoc(requestRef, updateData);
      await fetchReplenishmentRequests();
      return true;
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      setError('Erro ao cancelar solicitação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar solicitação por ID
  const getRequestById = (requestId) => {
    return requests.find(request => request.id === requestId);
  };

  // Estatísticas das solicitações
  const getRequestStats = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length
    };
  };

  // Listener em tempo real para solicitaÃ§Ãµes
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'replenishmentRequests'),
      orderBy('requestDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return {
    requests,
    loading,
    error,
    fetchReplenishmentRequests,
    createReplenishmentRequest,
    approveRequest,
    rejectRequest,
    executeReplenishment,
    cancelRequest,
    getRequestById,
    getRequestStats
  };
};
