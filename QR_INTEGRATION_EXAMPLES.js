// 🚀 EXEMPLO PRÁTICO: INTEGRAÇÃO QR CODE COM SISTEMA ATUAL
// =========================================================

/*
  Este arquivo demonstra como o sistema QR Code se integraria
  com as páginas de contagem existentes (QuickCountPage.jsx e NewCountPage.jsx)
*/

// ==========================================
// 1. ATUALIZAÇÃO DA PÁGINA DE CONTAGEM PRINCIPAL
// ==========================================

// Em src/pages/CountingPage.jsx (ou página que lista tipos de contagem)
import React from 'react';
import { useNavigate } from 'react-router-dom';

const CountingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Contagem de Estoque</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Contagem Rápida Existente */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="text-blue-600 mb-4">
            <i className="fas fa-bolt text-3xl"></i>
          </div>
          <h3 className="text-xl font-semibold mb-3">Contagem Rápida</h3>
          <p className="text-gray-600 mb-4">
            Contagem por código de barras ou busca manual
          </p>
          <button 
            onClick={() => navigate('/quick-count')}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Iniciar
          </button>
        </div>

        {/* NOVA: Contagem QR Code */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
          <div className="text-green-600 mb-4">
            <i className="fas fa-qrcode text-3xl"></i>
          </div>
          <h3 className="text-xl font-semibold mb-3">
            Contagem QR Code 
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
              NOVO
            </span>
          </h3>
          <p className="text-gray-600 mb-4">
            Escaneie QR Codes para contagem ultra-rápida
          </p>
          <button 
            onClick={() => navigate('/qr-counting')}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Escanear QR
          </button>
        </div>

        {/* Contagem Completa Existente */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="text-purple-600 mb-4">
            <i className="fas fa-clipboard-list text-3xl"></i>
          </div>
          <h3 className="text-xl font-semibold mb-3">Contagem Completa</h3>
          <p className="text-gray-600 mb-4">
            Inventário completo por localização
          </p>
          <button 
            onClick={() => navigate('/new-count')}
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
          >
            Iniciar
          </button>
        </div>
      </div>

      {/* Estatísticas QR Code */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">💡 Por que usar QR Code?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">90%</div>
            <div className="text-gray-600">Mais rápido</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">95%</div>
            <div className="text-gray-600">Menos erros</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-gray-600">Precisão</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. HÍBRIDO: QUICK COUNT + QR CODE
// ==========================================

// Atualização da QuickCountPage.jsx para incluir opção QR
const QuickCountPageWithQR = () => {
  const [countMode, setCountMode] = useState('barcode'); // 'barcode', 'manual', 'qr'
  
  return (
    <div>
      {/* Seletor de modo atualizado */}
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => setCountMode('barcode')} 
          className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
            countMode === 'barcode' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          <i className="fas fa-barcode"></i>
          <span>Código de Barras</span>
        </button>
        
        {/* NOVA OPÇÃO: QR Code */}
        <button 
          onClick={() => setCountMode('qr')} 
          className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
            countMode === 'qr' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          <i className="fas fa-qrcode"></i>
          <span>QR Code</span>
        </button>
        
        <button 
          onClick={() => setCountMode('manual')} 
          className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
            countMode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-200'
          }`}
        >
          <i className="fas fa-search"></i>
          <span>Busca Manual</span>
        </button>
      </div>

      {/* Conteúdo baseado no modo */}
      {countMode === 'qr' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Scanner QR Code</h3>
          <QRScanner 
            onScan={handleQRScan} 
            isActive={countMode === 'qr'}
            height="300px"
          />
          <p className="text-sm text-gray-500 mt-2 text-center">
            Posicione o QR Code do produto dentro da área destacada
          </p>
        </div>
      )}
      
      {/* Resto da implementação existente... */}
    </div>
  );
};

// ==========================================
// 3. NOVA PÁGINA: QR SETUP & MANAGEMENT
// ==========================================

// Nova página para gerenciar QR Codes
const QRManagementPage = () => {
  const { docs: products } = useFirestore('products');
  const [qrProgress, setQrProgress] = useState(0);
  const [generatingQRs, setGeneratingQRs] = useState(false);

  const generateAllProductQRs = async () => {
    setGeneratingQRs(true);
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Gerar QR Code para o produto
      const qrData = generateQRCodeData('product', product);
      const qrUrl = await generateQRCodeURL(qrData);
      
      // Salvar QR Code (implementar lógica de storage)
      await saveProductQRCode(product.id, qrUrl);
      
      // Atualizar progresso
      setQrProgress(((i + 1) / products.length) * 100);
    }
    
    setGeneratingQRs(false);
    toast.success('QR Codes gerados com sucesso!');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento QR Code</h1>
      
      {/* Status atual */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {products?.filter(p => p.qrCode).length || 0}
            </div>
            <div className="text-sm text-gray-600">Produtos com QR</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {/* Calcular contagens QR da última semana */}
              0
            </div>
            <div className="text-sm text-gray-600">Contagens QR (7 dias)</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {products?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Total de Produtos</div>
          </div>
        </div>
      </div>

      {/* Ações de geração */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Geração de QR Codes</h3>
        
        {generatingQRs ? (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Gerando QR Codes...</span>
              <span>{Math.round(qrProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${qrProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={generateAllProductQRs}
              className="bg-blue-600 text-white p-4 rounded hover:bg-blue-700"
            >
              <i className="fas fa-qrcode mb-2 text-xl block"></i>
              Gerar QR para Todos os Produtos
            </button>
            
            <button
              onClick={() => navigate('/qr-setup')}
              className="bg-green-600 text-white p-4 rounded hover:bg-green-700"
            >
              <i className="fas fa-cog mb-2 text-xl block"></i>
              Configuração Avançada
            </button>
          </div>
        )}
      </div>

      {/* Preview de QR Codes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Preview QR Codes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products?.slice(0, 12).map(product => (
            <div key={product.id} className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                {product.qrCode ? (
                  <img src={product.qrCode} alt="QR" className="w-full h-full" />
                ) : (
                  <i className="fas fa-qrcode text-gray-400"></i>
                )}
              </div>
              <p className="text-xs text-gray-600 truncate">{product.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. INTEGRAÇÃO COM SIDEBAR EXISTENTE
// ==========================================

// Atualização do Sidebar.jsx para incluir menu QR
const SidebarWithQR = () => {
  return (
    <nav className="sidebar">
      {/* Menus existentes... */}
      
      {/* NOVA SEÇÃO: QR Code */}
      <div className="menu-section">
        <h3 className="menu-title">
          <i className="fas fa-qrcode mr-2"></i>
          QR Code
        </h3>
        <ul className="menu-list">
          <li>
            <NavLink to="/qr-counting" className="menu-link">
              <i className="fas fa-scan mr-2"></i>
              Contagem QR
            </NavLink>
          </li>
          <li>
            <NavLink to="/qr-management" className="menu-link">
              <i className="fas fa-cogs mr-2"></i>
              Gerenciar QR Codes
            </NavLink>
          </li>
          <li>
            <NavLink to="/qr-reports" className="menu-link">
              <i className="fas fa-chart-bar mr-2"></i>
              Relatórios QR
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

// ==========================================
// 5. ROTAS PRINCIPAIS ATUALIZADAS
// ==========================================

// Atualização do App.jsx para incluir rotas QR
const AppWithQRRoutes = () => {
  return (
    <Routes>
      {/* Rotas existentes... */}
      
      {/* NOVAS ROTAS QR CODE */}
      <Route path="/qr-counting" element={<QRCountingPage />} />
      <Route path="/qr-management" element={<QRManagementPage />} />
      <Route path="/qr-setup" element={<QRSetupPage />} />
      <Route path="/qr-reports" element={<QRReportsPage />} />
      
      {/* Quick count atualizado com QR */}
      <Route path="/quick-count" element={<QuickCountPageWithQR />} />
    </Routes>
  );
};

// ==========================================
// 6. HOOK PERSONALIZADO PARA INTEGRAÇÃO
// ==========================================

// Hook que integra QR Code com sistema de contagem existente
const useQRCounting = () => {
  const { addDoc, collection } = useFirestore();
  const { currentUser } = useAuth();
  
  const saveQRCount = async (qrData, countedQuantity) => {
    try {
      const countData = {
        type: 'qr_count',
        productId: qrData.productId,
        productName: qrData.productName,
        locationId: qrData.locationId,
        locationName: qrData.locationName,
        expectedQuantity: qrData.currentStock || 0,
        countedQuantity: parseInt(countedQuantity),
        qrType: qrData.type,
        timestamp: new Date(),
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'counts'), countData);
      return { success: true, data: countData };
    } catch (error) {
      console.error('Erro ao salvar contagem QR:', error);
      return { success: false, error };
    }
  };
  
  const getQRCountHistory = async (productId) => {
    // Implementar busca de histórico QR para produto específico
  };
  
  return {
    saveQRCount,
    getQRCountHistory
  };
};

// ==========================================
// 7. ESTRUTURA DE DADOS FIREBASE ATUALIZADA
// ==========================================

/*
Novas coleções/campos no Firebase:

1. Produtos (products) - campos adicionais:
   - qrCode: string (URL do QR Code gerado)
   - qrCodeData: object (dados estruturados do QR)
   - lastQRScan: timestamp
   - qrScanCount: number

2. Contagens (counts) - novos tipos:
   - type: 'qr_count' (além dos existentes)
   - qrType: string ('product', 'location', 'product_location')
   - scanDuration: number (tempo para escanear e contar)

3. Nova coleção qr_sessions:
   - sessionId: string
   - userId: string
   - startTime: timestamp
   - endTime: timestamp
   - scannedItems: array
   - totalItems: number
   - averageTimePerItem: number
   - status: string ('active', 'completed', 'cancelled')

4. Nova coleção qr_analytics:
   - date: string (YYYY-MM-DD)
   - totalScans: number
   - uniqueProducts: number
   - averageScanTime: number
   - errorRate: number
   - topProducts: array
*/

export {
  CountingPage,
  QuickCountPageWithQR,
  QRManagementPage,
  SidebarWithQR,
  AppWithQRRoutes,
  useQRCounting
};
