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

  // Buscar solicitaÃ§Ãµes de reposiÃ§Ã£o
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

      // Ordenar por data de criaÃ§Ã£o (mais recentes primeiro)
      q = query(q, orderBy('requestDate', 'desc'));

      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRequests(requestsData);
      return requestsData;
    } catch (error) {
      console.error('Erro ao buscar solicitaÃ§Ãµes:', error);
      setError('Erro ao carregar solicitaÃ§Ãµes de reposiÃ§Ã£o');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Criar nova solicitaÃ§Ã£o de reposiÃ§Ã£o
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
      
      // Notificar gestores sobre nova solicitaÃ§Ã£o
      addNotification({
        type: 'info',
        title: 'Nova SolicitaÃ§Ã£o de ReposiÃ§Ã£o',
        message: `${userData?.displayName || currentUser.email} criou uma solicitaÃ§Ã£o de reposiÃ§Ã£o`,
        action: {
          label: 'Ver SolicitaÃ§Ã£o',
          route: `/replenishment/requests/${docRef.id}`
        }
      });

      await fetchReplenishmentRequests();
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar solicitaÃ§Ã£o:', error);
      setError('Erro ao criar solicitaÃ§Ã£o de reposiÃ§Ã£o');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Aprovar solicitaÃ§Ã£o
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
          title: 'SolicitaÃ§Ã£o Aprovada',
          message: `Sua solicitaÃ§Ã£o de reposiÃ§Ã£o foi aprovada por ${userData?.displayName || currentUser.email}`,
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
      console.error('Erro ao aprovar solicitaÃ§Ã£o:', error);
      setError('Erro ao aprovar solicitaÃ§Ã£o');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Rejeitar solicitaÃ§Ã£o
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
          title: 'SolicitaÃ§Ã£o Rejeitada',
          message: `Sua solicitaÃ§Ã£o de reposiÃ§Ã£o foi rejeitada. Motivo: ${rejectionData.reason || 'NÃ£o informado'}`,
          targetUserId: request.requestedBy
        });
      }

      await fetchReplenishmentRequests();
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitaÃ§Ã£o:', error);
      setError('Erro ao rejeitar solicitaÃ§Ã£o');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Executar reposiÃ§Ã£o
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

      // Notificar gestor sobre conclusÃ£o
      const request = requests.find(r => r.id === requestId);
      if (request && request.approvedBy) {
        addNotification({
          type: 'success',
          title: 'ReposiÃ§Ã£o ConcluÃ­da',
          message: `A reposiÃ§Ã£o foi executada por ${userData?.displayName || currentUser.email}`,
          targetUserId: request.approvedBy
        });
      }

      await fetchReplenishmentRequests();
      return true;
    } catch (error) {
      console.error('Erro ao executar reposiÃ§Ã£o:', error);
      setError('Erro ao executar reposiÃ§Ã£o');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cancelar solicitaÃ§Ã£o
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
      console.error('Erro ao cancelar solicitaÃ§Ã£o:', error);
      setError('Erro ao cancelar solicitaÃ§Ã£o');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar solicitaÃ§Ã£o por ID
  const getRequestById = (requestId) => {
    return requests.find(request => request.id === requestId);
  };

  // EstatÃ­sticas das solicitaÃ§Ãµes
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
