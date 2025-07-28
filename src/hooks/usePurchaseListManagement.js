import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc,
  deleteDoc,
  updateDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { PURCHASE_LIST_STATUS } from '../utils/replenishmentPermissions';
import { exportToExcel, exportToPDF, exportToCSV } from '../utils/exportUtils';

export const usePurchaseListManagement = () => {
  const { currentUser, userData } = useAuth();
  const [purchaseLists, setPurchaseLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar listas de compras em tempo real
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'purchaseLists'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const lists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        setPurchaseLists(lists);
      },
      (error) => {
        console.error('Erro ao carregar listas:', error);
        setError('Erro ao carregar listas de compras');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Analisar produtos com estoque baixo
  const analyzeLowStock = async (config = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Configurações padrão
      const defaultConfig = {
        minStockPercentage: 20,
        criticalStockPercentage: 10,
        includeInactive: false
      };

      const analysisConfig = { ...defaultConfig, ...config };

      // Buscar todos os produtos
      const productsQuery = query(
        collection(db, 'products'),
        ...(analysisConfig.includeInactive ? [] : [where('isActive', '==', true)])
      );

      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Buscar estoque atual de todos os produtos
      const stockQuery = query(collection(db, 'stock'));
      const stockSnapshot = await getDocs(stockQuery);
      const stockData = {};

      stockSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!stockData[data.productId]) {
          stockData[data.productId] = 0;
        }
        stockData[data.productId] += data.quantity || 0;
      });

      // Analisar produtos com estoque baixo
      const lowStockItems = [];

      products.forEach(product => {
        const currentStock = stockData[product.id] || 0;
        const maxStock = product.maxStock || product.minStock * 5; // Estimativa se não houver maxStock
        const minStock = product.minStock || 0;
        
        const stockPercentage = maxStock > 0 ? (currentStock / maxStock) * 100 : 0;
        const isBelowMin = currentStock <= minStock;
        const isLowStock = stockPercentage <= analysisConfig.minStockPercentage;
        const isCritical = stockPercentage <= analysisConfig.criticalStockPercentage;

        if (isBelowMin || isLowStock) {
          // Calcular quantidade sugerida
          const suggestedQuantity = Math.max(
            maxStock - currentStock,
            minStock * 2 - currentStock,
            product.economicOrderQuantity || 10
          );

          lowStockItems.push({
            ...product,
            currentStock,
            stockPercentage: Math.round(stockPercentage),
            suggestedQuantity,
            priority: isCritical ? 'critical' : isLowStock ? 'high' : 'medium',
            totalCost: (product.cost || 0) * suggestedQuantity,
            isBelowMin,
            isLowStock,
            isCritical
          });
        }
      });

      // Ordenar por prioridade e depois por percentual de estoque
      lowStockItems.sort((a, b) => {
        const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return a.stockPercentage - b.stockPercentage;
      });

      return {
        items: lowStockItems,
        summary: {
          totalItems: lowStockItems.length,
          criticalItems: lowStockItems.filter(item => item.isCritical).length,
          highPriorityItems: lowStockItems.filter(item => item.priority === 'high').length,
          totalEstimatedCost: lowStockItems.reduce((sum, item) => sum + item.totalCost, 0)
        },
        config: analysisConfig
      };
    } catch (error) {
      console.error('Erro ao analisar estoque baixo:', error);
      setError('Erro ao analisar produtos com estoque baixo');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Gerar lista de compras
  const generatePurchaseList = async (items, metadata = {}) => {
    setLoading(true);
    setError(null);

    try {
      const purchaseList = {
        generatedBy: currentUser.uid,
        generatedByName: userData?.displayName || currentUser.email,
        generatedDate: Timestamp.now(),
        status: 'generated',
        items: items,
        metadata: {
          ...metadata,
          totalItems: items.length,
          totalEstimatedCost: items.reduce((sum, item) => sum + (item.totalCost || 0), 0),
          criticalItems: items.filter(item => item.priority === 'critical').length,
          highPriorityItems: items.filter(item => item.priority === 'high').length
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'purchaseLists'), purchaseList);
      
      await fetchPurchaseLists();
      return docRef.id;
    } catch (error) {
      console.error('Erro ao gerar lista de compras:', error);
      setError('Erro ao gerar lista de compras');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar listas de compras
  const fetchPurchaseLists = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      let q = collection(db, 'purchaseLists');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.generatedBy) {
        q = query(q, where('generatedBy', '==', filters.generatedBy));
      }

      q = query(q, orderBy('generatedDate', 'desc'));

      const querySnapshot = await getDocs(q);
      const listsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPurchaseLists(listsData);
      return listsData;
    } catch (error) {
      console.error('Erro ao buscar listas de compras:', error);
      setError('Erro ao carregar listas de compras');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Calcular previsão de gastos por categoria
  const calculateCategoryExpenses = (items) => {
    const categoryExpenses = {};

    items.forEach(item => {
      const category = item.category || 'Sem Categoria';
      if (!categoryExpenses[category]) {
        categoryExpenses[category] = {
          items: 0,
          totalCost: 0,
          averageCost: 0
        };
      }

      categoryExpenses[category].items += 1;
      categoryExpenses[category].totalCost += item.totalCost || 0;
    });

    // Calcular média por categoria
    Object.keys(categoryExpenses).forEach(category => {
      const data = categoryExpenses[category];
      data.averageCost = data.items > 0 ? data.totalCost / data.items : 0;
    });

    return categoryExpenses;
  };

  // Calcular previsão de gastos por fornecedor
  const calculateSupplierExpenses = (items) => {
    const supplierExpenses = {};

    items.forEach(item => {
      const supplier = item.supplier || 'Fornecedor Não Definido';
      if (!supplierExpenses[supplier]) {
        supplierExpenses[supplier] = {
          items: 0,
          totalCost: 0,
          averageCost: 0
        };
      }

      supplierExpenses[supplier].items += 1;
      supplierExpenses[supplier].totalCost += item.totalCost || 0;
    });

    // Calcular média por fornecedor
    Object.keys(supplierExpenses).forEach(supplier => {
      const data = supplierExpenses[supplier];
      data.averageCost = data.items > 0 ? data.totalCost / data.items : 0;
    });

    return supplierExpenses;
  };

  // Sugerir otimizações na lista de compras
  const suggestOptimizations = (items) => {
    const suggestions = [];

    // Verificar itens sem fornecedor definido
    const itemsWithoutSupplier = items.filter(item => !item.supplier);
    if (itemsWithoutSupplier.length > 0) {
      suggestions.push({
        type: 'warning',
        title: 'Fornecedores não definidos',
        message: `${itemsWithoutSupplier.length} itens não possuem fornecedor definido`,
        items: itemsWithoutSupplier
      });
    }

    // Verificar itens sem custo definido
    const itemsWithoutCost = items.filter(item => !item.cost || item.cost === 0);
    if (itemsWithoutCost.length > 0) {
      suggestions.push({
        type: 'warning',
        title: 'Custos não definidos',
        message: `${itemsWithoutCost.length} itens não possuem custo definido`,
        items: itemsWithoutCost
      });
    }

    // Sugerir agrupamento por fornecedor
    const supplierGroups = calculateSupplierExpenses(items);
    const suppliersCount = Object.keys(supplierGroups).length;
    
    if (suppliersCount > 1) {
      suggestions.push({
        type: 'info',
        title: 'Agrupamento por fornecedor',
        message: `Considere agrupar as compras pelos ${suppliersCount} fornecedores para otimizar custos de frete`,
        data: supplierGroups
      });
    }

    return suggestions;
  };

  // Exportar lista de compras para PDF/Excel
  const exportPurchaseList = async (list, format = 'excel') => {
    try {
      if (!list) {
        throw new Error('Lista não encontrada');
      }

      let success = false;
      const filename = `lista_compras_${list.title.replace(/\s+/g, '_').toLowerCase()}`;

      switch (format.toLowerCase()) {
        case 'excel':
        case 'xlsx':
          success = exportToExcel(list, filename);
          break;
        case 'pdf':
          success = exportToPDF(list, filename);
          break;
        case 'csv':
          success = exportToCSV(list, filename);
          break;
        default:
          throw new Error('Formato não suportado');
      }

      if (success) {
        // Registrar exportação no histórico da lista
        await updateDoc(doc(db, 'purchaseLists', list.id), {
          exportHistory: {
            [`export_${Date.now()}`]: {
              format,
              exportedAt: Timestamp.now(),
              exportedBy: currentUser.uid
            }
          }
        });
      }

      return { success, format, filename };
    } catch (error) {
      console.error('Erro ao exportar lista:', error);
      setError('Erro ao exportar lista de compras');
      throw error;
    }
  };

  // Deletar lista de compras
  const deletePurchaseList = async (listId) => {
    try {
      await deleteDoc(doc(db, 'purchaseLists', listId));
    } catch (error) {
      console.error('Erro ao deletar lista:', error);
      setError('Erro ao deletar lista de compras');
      throw error;
    }
  };

  // Atualizar status da lista
  const updateListStatus = async (listId, status, notes = '') => {
    try {
      await updateDoc(doc(db, 'purchaseLists', listId), {
        status,
        updatedAt: Timestamp.now(),
        statusHistory: {
          [status]: {
            timestamp: Timestamp.now(),
            updatedBy: currentUser.uid,
            notes
          }
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao atualizar status da lista');
      throw error;
    }
  };

  // Gerar lista personalizada
  const generateCustomPurchaseList = async (selectedProducts, title, notes = '') => {
    try {
      const listData = {
        title,
        notes,
        type: 'custom',
        items: selectedProducts,
        summary: {
          totalItems: selectedProducts.length,
          totalCost: selectedProducts.reduce((sum, item) => 
            sum + (item.quantity * (item.unitCost || 0)), 0
          ),
          criticalItems: selectedProducts.filter(item => item.priority === 'critical').length,
          suppliers: [...new Set(selectedProducts.map(item => item.supplierId))].length
        },
        status: PURCHASE_LIST_STATUS.GENERATED,
        createdBy: currentUser.uid,
        createdByName: userData?.displayName || userData?.email || 'Usuário',
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'purchaseLists'), listData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao gerar lista personalizada:', error);
      setError('Erro ao gerar lista personalizada');
      throw error;
    }
  };

  return {
    purchaseLists,
    loading,
    error,
    analyzeLowStock,
    generatePurchaseList,
    fetchPurchaseLists,
    calculateCategoryExpenses,
    calculateSupplierExpenses,
    suggestOptimizations,
    exportPurchaseList,
    deletePurchaseList,
    updateListStatus,
    generateCustomPurchaseList
  };
};
