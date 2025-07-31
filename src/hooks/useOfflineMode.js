
// Hook simplificado: apenas retorna se está online
export const useOfflineMode = () => {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return { isOnline };
};
