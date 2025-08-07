import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';

function PWAUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  React.useEffect(() => {
    if (offlineReady) {
      toast.success('Aplicativo pronto para funcionar offline.', { duration: 4000 });
    }
  }, [offlineReady]);

  React.useEffect(() => {
    if (needRefresh) {
      toast(
        (t) => (
          <div className="flex flex-col items-center gap-2">
            <span className="text-center">
              Uma nova versão está disponível!
            </span>
            <div className="flex gap-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm"
                onClick={() => updateServiceWorker(true)}
              >
                Atualizar
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded text-sm"
                onClick={() => toast.dismiss(t.id)}
              >
                Ignorar
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity, // Mantém o toast aberto até a interação do usuário
        }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  return null; // Este componente não renderiza nada diretamente
}

export default PWAUpdater;
