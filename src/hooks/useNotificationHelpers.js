import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import useFirestore from './useFirestore';

// Hook para monitorar notificaÃ§Ãµes automÃ¡ticas do sistema
export const useAutoNotifications = () => {
  const { notifyLowStock, notifyOutOfStock, notifyStockMovement } = useNotifications();
  const { docs: products } = useFirestore('products');
  const notifiedProducts = useRef(new Set()); // Cache para evitar notificaÃ§Ãµes duplicadas
  const lastCheck = useRef(0); // Timestamp da Ãºltima verificaÃ§Ã£o

  useEffect(() => {
    if (!products || products.length === 0) return;

    // Limitar verificaÃ§Ãµes para evitar spam (mÃ¡ximo 1 por minuto)
    const now = Date.now();
    if (now - lastCheck.current < 60000) return; // 60 segundos
    lastCheck.current = now;

    // Verificar produtos com estoque baixo ou zerado
    products.forEach(product => {
      const currentStock = product.quantity || 0;
      const minStock = product.minStock || 5;
      const productKey = `${product.id}_${currentStock}`;

      // Evitar notificaÃ§Ãµes duplicadas para o mesmo produto com mesmo estoque
      if (notifiedProducts.current.has(productKey)) return;

      if (currentStock === 0) {
        notifyOutOfStock({ name: product.name, id: product.id }, product.code);
        notifiedProducts.current.add(productKey);
      } else if (currentStock <= minStock) {
        notifyLowStock({ name: product.name, id: product.id }, currentStock);
        notifiedProducts.current.add(productKey);
      }
    });

    // Limpar cache antigas (manter apenas as Ãºltimas 100 entradas)
    if (notifiedProducts.current.size > 100) {
      const entries = Array.from(notifiedProducts.current);
      notifiedProducts.current = new Set(entries.slice(-50)); // Manter apenas as 50 mais recentes
    }
  }, [products, notifyLowStock, notifyOutOfStock]);

  // Limpar cache quando componente desmonta
  useEffect(() => {
    return () => {
      notifiedProducts.current.clear();
    };
  }, []);

  return {
    // FunÃ§Ã£o para notificar movimento manual
    notifyMovement: notifyStockMovement,
  };
};

// Hook para notificaÃ§Ãµes de aÃ§Ãµes do usuÃ¡rio
export const useUserActionNotifications = () => {
  const { notifyUserAction } = useNotifications();

  const notifyProductAdded = (productName) => {
    notifyUserAction(`Produto "${productName}" adicionado com sucesso`, 'success');
  };

  const notifyProductUpdated = (productName) => {
    notifyUserAction(`Produto "${productName}" atualizado com sucesso`, 'success');
  };

  const notifyProductDeleted = (productName) => {
    notifyUserAction(`Produto "${productName}" removido do sistema`, 'warning');
  };

  const notifyStockAdjustment = (productName, newQuantity) => {
    notifyUserAction(`Estoque do produto "${productName}" ajustado para ${newQuantity} unidades`, 'info');
  };

  const notifyTransferCompleted = (productName, quantity, fromLocation, toLocation) => {
    notifyUserAction(`${quantity} unidades de "${productName}" transferidas de ${fromLocation} para ${toLocation}`, 'success');
  };

  const notifyExitCompleted = (productName, quantity, reason) => {
    notifyUserAction(`${quantity} unidades de "${productName}" removidas - ${reason}`, 'info');
  };

  const notifyCountCompleted = (countName, totalItems) => {
    notifyUserAction(`Contagem "${countName}" finalizada com ${totalItems} itens`, 'success');
  };

  const notifyBackupCreated = () => {
    notifyUserAction('Backup dos dados criado com sucesso', 'success');
  };

  const notifyDataImported = (itemCount) => {
    notifyUserAction(`${itemCount} itens importados com sucesso`, 'success');
  };

  return {
    notifyProductAdded,
    notifyProductUpdated,
    notifyProductDeleted,
    notifyStockAdjustment,
    notifyTransferCompleted,
    notifyExitCompleted,
    notifyCountCompleted,
    notifyBackupCreated,
    notifyDataImported,
  };
};
