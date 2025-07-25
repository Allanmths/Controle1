import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaMobile, FaDesktop } from 'react-icons/fa';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar se jÃ¡ estÃ¡ instalado
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              window.navigator.standalone ||
                              document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que o prompt apareÃ§a automaticamente
      e.preventDefault();
      
      // Salvar o evento para usar depois
      setDeferredPrompt(e);
      
      // Mostrar nosso prompt customizado se nÃ£o estiver instalado
      if (!isStandalone) {
        // Verificar se jÃ¡ foi dismissado recentemente
        const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        if (!lastDismissed || parseInt(lastDismissed) < oneDayAgo) {
          setTimeout(() => setShowPrompt(true), 3000); // Mostrar apÃ³s 3 segundos
        }
      }
    };

    // Listener para quando o app for instalado
    const handleAppInstalled = () => {
      console.log('PWA foi instalado');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar o prompt de instalaÃ§Ã£o
    deferredPrompt.prompt();

    // Aguardar a escolha do usuÃ¡rio
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('UsuÃ¡rio aceitou instalar o PWA');
    } else {
      console.log('UsuÃ¡rio rejeitou instalar o PWA');
    }

    // Limpar o deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Salvar timestamp do dismiss
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const getDeviceIcon = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? <FaMobile /> : <FaDesktop />;
  };

  const getInstallText = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      return {
        title: 'Adicionar Ã  Tela de InÃ­cio',
        description: 'Toque no Ã­cone de compartilhar e selecione "Adicionar Ã  Tela de InÃ­cio"',
        buttonText: 'InstruÃ§Ãµes iOS'
      };
    }
    
    if (isMobile) {
      return {
        title: 'Instalar Aplicativo',
        description: 'Instale o Estoque HCM em seu dispositivo para acesso rÃ¡pido e modo offline',
        buttonText: 'Instalar App'
      };
    }
    
    return {
      title: 'Instalar Aplicativo',
      description: 'Instale o Estoque HCM em seu computador para uma experiÃªncia melhor',
      buttonText: 'Instalar App'
    };
  };

  const handleIOSInstructions = () => {
    const instructions = `
Para instalar no iOS:
1. Toque no Ã­cone de compartilhar (ðŸ“¤) na parte inferior da tela
2. Role para baixo e toque em "Adicionar Ã  Tela de InÃ­cio"
3. Toque em "Adicionar" no canto superior direito
4. O app serÃ¡ adicionado Ã  sua tela de inÃ­cio
    `;
    
    alert(instructions.trim());
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  const { title, description, buttonText } = getInstallText();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-lg z-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-shrink-0 text-blue-600 text-xl">
              {getDeviceIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {title}
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                {description}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Fechar"
          >
            <FaTimes size={14} />
          </button>
        </div>
        
        <div className="flex space-x-2 mt-3">
          <button
            onClick={isIOS ? handleIOSInstructions : handleInstallClick}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FaDownload size={12} />
            <span>{buttonText}</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
          >
            Agora nÃ£o
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
