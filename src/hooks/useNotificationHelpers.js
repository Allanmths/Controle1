import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import useFirestore from './useFirestore';

// Hook para monitorar notificações automáticas do sistema
export const useAutoNotifications = () => {
  const { notifyLowStock, notifyOutOfStock, notifyStockMovement } = useNotifications();
  const { docs: products } = useFirestore('products');
  const notifiedProducts = useRef(new Set()); // Cache para evitar notificações duplicadas
  const lastCheck = useRef(0); // Timestamp da última verificação
  const notifiedSession = useRef(false); // Verifica se já notificou nesta sessão

  useEffect(() => {
    if (!products || products.length === 0) return;
    
    // Verifica se já notificou nesta sessão
    if (notifiedSession.current) return;
    
    // Verificar se já notificou hoje (usando localStorage)
    const lastNotificationDate = localStorage.getItem('lastLowStockNotificationDate');
    const today = new Date().toDateString();
    
    if (lastNotificationDate === today) {
      notifiedSession.current = true;
      return;
    }
    
    // Atualiza a data da última notificação
    localStorage.setItem('lastLowStockNotificationDate', today);
    notifiedSession.current = true;

    // Verificar produtos com estoque baixo ou zerado
    products.forEach(product => {
      const currentStock = product.quantity || 0;
      const minStock = product.minStock || 5;
      const productKey = `${product.id}_${currentStock}`;

      // Evitar notificações duplicadas para o mesmo produto com mesmo estoque
      if (notifiedProducts.current.has(productKey)) return;

      if (currentStock === 0) {
        notifyOutOfStock({ name: product.name, id: product.id }, product.code);
        notifiedProducts.current.add(productKey);
      } else if (currentStock <= minStock) {
        notifyLowStock({ name: product.name, id: product.id }, currentStock);
        notifiedProducts.current.add(productKey);
      }
    });

    // Limpar cache antigas (manter apenas as últimas 100 entradas)
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
    // Função para notificar movimento manual
    notifyMovement: notifyStockMovement,
  };
};

// Hook para notificações de ações do usuário
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
