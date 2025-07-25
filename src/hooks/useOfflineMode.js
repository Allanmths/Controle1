import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// IndexedDB para armazenamento offline
const DB_NAME = 'EstoqueHCM_Offline';
const DB_VERSION = 1;
const STORES = {
  COUNTS: 'offline_counts',
  PRODUCTS: 'cached_products',
  LOCATIONS: 'cached_locations',
  CATEGORIES: 'cached_categories'
};

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState({
    counts: [],
    products: [],
    locations: [],
    categories: []
  });
  const [db, setDb] = useState(null);

  // Inicializar IndexedDB
  useEffect(() => {
    initializeDB();
  }, []);

  // Monitorar status da conexÃ£o
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('ConexÃ£o restaurada! Sincronizando dados...', {
        duration: 3000,
        icon: 'ðŸŒ'
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('VocÃª estÃ¡ offline. Dados serÃ£o salvos localmente.', {
        duration: 4000,
        icon: 'ðŸ“±'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker messaging
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, []);

  const handleSWMessage = (event) => {
    const { type, data, message } = event.data;

    switch (type) {
      case 'OFFLINE_MODE':
        toast.warning(message || 'Modo offline ativado', {
          duration: 3000,
          icon: 'ðŸ“±'
        });
        break;
      
      case 'SYNC_OFFLINE_DATA':
        if (data && data.length > 0) {
          syncOfflineData();
        }
        break;
      
      default:
        break;
    }
  };

  const initializeDB = async () => {
    try {
      const database = await openDB();
      setDb(database);
      loadOfflineData();
    } catch (error) {
      console.error('Erro ao inicializar IndexedDB:', error);
      toast.error('Erro ao configurar armazenamento offline');
    }
  };

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Criar stores se nÃ£o existirem
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: 'id',
              autoIncrement: true 
            });
            
            // Adicionar Ã­ndices
            if (storeName === STORES.COUNTS) {
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }
          }
        });
      };
    });
  };

  const loadOfflineData = async () => {
    if (!db) return;

    try {
      const counts = await getAllFromStore(STORES.COUNTS);
      const products = await getAllFromStore(STORES.PRODUCTS);
      const locations = await getAllFromStore(STORES.LOCATIONS);
      const categories = await getAllFromStore(STORES.CATEGORIES);

      setOfflineData({
        counts: counts || [],
        products: products || [],
        locations: locations || [],
        categories: categories || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados offline:', error);
    }
  };

  const getAllFromStore = (storeName) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const addToStore = (storeName, data) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const updateInStore = (storeName, data) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const deleteFromStore = (storeName, id) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  // Cache de dados para uso offline
  const cacheDataForOffline = useCallback(async (type, data) => {
    if (!db || !data) return;

    try {
      const storeName = STORES[type.toUpperCase()];
      if (!storeName) return;

      // Limpar cache anterior
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();

      // Adicionar novos dados
      const addPromises = data.map(item => addToStore(storeName, item));
      await Promise.all(addPromises);

      console.log(`[Offline] Cached ${data.length} ${type} items`);
    } catch (error) {
      console.error(`Erro ao fazer cache de ${type}:`, error);
    }
  }, [db]);

  // Salvar contagem offline
  const saveOfflineCount = useCallback(async (countData) => {
    if (!db) {
      toast.error('Armazenamento offline nÃ£o disponÃ­vel');
      return false;
    }

    try {
      const offlineCount = {
        ...countData,
        id: `offline_${Date.now()}`,
        status: 'offline',
        timestamp: new Date(),
        synced: false
      };

      await addToStore(STORES.COUNTS, offlineCount);
      
      // Atualizar estado local
      setOfflineData(prev => ({
        ...prev,
        counts: [...prev.counts, offlineCount]
      }));

      toast.success('Contagem salva offline! SerÃ¡ sincronizada quando voltar online.', {
        duration: 4000,
        icon: 'ðŸ’¾'
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar contagem offline:', error);
      toast.error('Erro ao salvar contagem offline');
      return false;
    }
  }, [db]);

  // Sincronizar dados offline quando voltar online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || !db) return;

    try {
      const pendingCounts = offlineData.counts.filter(count => !count.synced);
      
      if (pendingCounts.length === 0) {
        console.log('[Offline] Nenhum dado para sincronizar');
        return;
      }

      console.log(`[Offline] Sincronizando ${pendingCounts.length} contagens...`);

      // Simular sincronizaÃ§Ã£o (aqui vocÃª implementaria a lÃ³gica real)
      const syncPromises = pendingCounts.map(async (count) => {
        try {
          // Aqui vocÃª faria a requisiÃ§Ã£o real para o Firebase
          // const result = await syncCountToFirebase(count);
          
          // Marcar como sincronizado
          const syncedCount = { ...count, synced: true };
          await updateInStore(STORES.COUNTS, syncedCount);
          
          return true;
        } catch (error) {
          console.error('Erro ao sincronizar contagem:', count.id, error);
          return false;
        }
      });

      const results = await Promise.all(syncPromises);
      const successCount = results.filter(Boolean).length;

      if (successCount > 0) {
        toast.success(`${successCount} contagem(ns) sincronizada(s) com sucesso!`, {
          duration: 3000,
          icon: 'âœ…'
        });
        
        // Recarregar dados offline
        loadOfflineData();
      }

    } catch (error) {
      console.error('Erro durante sincronizaÃ§Ã£o:', error);
      toast.error('Erro ao sincronizar dados offline');
    }
  }, [isOnline, db, offlineData.counts]);

  // Limpar dados sincronizados
  const clearSyncedData = useCallback(async () => {
    if (!db) return;

    try {
      const transaction = db.transaction([STORES.COUNTS], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Buscar apenas dados sincronizados
      const allCounts = await getAllFromStore(STORES.COUNTS);
      const syncedCounts = allCounts.filter(count => count.synced);
      
      // Deletar dados sincronizados
      const deletePromises = syncedCounts.map(count => 
        deleteFromStore(STORES.COUNTS, count.id)
      );
      
      await Promise.all(deletePromises);
      
      // Atualizar estado
      loadOfflineData();
      
      console.log(`[Offline] Limpeza: ${syncedCounts.length} itens removidos`);
    } catch (error) {
      console.error('Erro ao limpar dados sincronizados:', error);
    }
  }, [db]);

  return {
    isOnline,
    offlineData,
    saveOfflineCount,
    syncOfflineData,
    clearSyncedData,
    cacheDataForOffline,
    hasOfflineData: offlineData.counts.length > 0
  };
};
