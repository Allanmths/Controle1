// 🚀 IMPLEMENTAÇÃO PRÁTICA: QR CODE EXPANDIDO COM TRANSFERÊNCIAS E SAÍDAS

// ==========================================
// 1. COMPONENTE PRINCIPAL: SELETOR DE OPERAÇÃO
// ==========================================

// components/qr/QROperationSelector.jsx
import React from 'react';

const QROperationSelector = ({ scannedProduct, onSelectOperation, onCancel }) => {
  const operations = [
    {
      id: 'count',
      name: 'Contagem',
      icon: 'fa-calculator',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      description: 'Contar estoque atual'
    },
    {
      id: 'transfer',
      name: 'Transferência',
      icon: 'fa-exchange-alt',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200', 
      textColor: 'text-green-600',
      description: 'Mover entre localizações'
    },
    {
      id: 'exit',
      name: 'Saída',
      icon: 'fa-sign-out-alt',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      description: 'Baixa de estoque'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Produto Escaneado</h3>
        <div className="bg-gray-50 p-4 rounded border">
          <h4 className="font-medium text-lg">{scannedProduct.name}</h4>
          <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
            {scannedProduct.sku && (
              <div><span className="font-medium">SKU:</span> {scannedProduct.sku}</div>
            )}
            {scannedProduct.category && (
              <div><span className="font-medium">Categoria:</span> {scannedProduct.category}</div>
            )}
            <div>
              <span className="font-medium">Estoque Total:</span> {
                Object.values(scannedProduct.locations || {})
                  .reduce((sum, qty) => sum + (Number(qty) || 0), 0)
              }
            </div>
            {scannedProduct.location && (
              <div><span className="font-medium">Localização:</span> {scannedProduct.location.name}</div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Selecione a Operação</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operations.map(operation => (
            <button
              key={operation.id}
              onClick={() => onSelectOperation(operation.id)}
              className={`p-6 rounded-lg border-2 ${operation.borderColor} ${operation.bgColor} 
                         hover:shadow-md transition-all duration-200 text-center`}
            >
              <i className={`fas ${operation.icon} text-3xl ${operation.textColor} mb-3 block`}></i>
              <h4 className="text-lg font-semibold mb-2">{operation.name}</h4>
              <p className="text-sm text-gray-600">{operation.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Cancelar / Novo Scan
        </button>
      </div>
    </div>
  );
};

export default QROperationSelector;

// ==========================================
// 2. INTERFACE DE TRANSFERÊNCIA
// ==========================================

// components/qr/QRTransferInterface.jsx
import React, { useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { useQRTransfer } from '../../hooks/qr/useQRTransfer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const QRTransferInterface = ({ scannedProduct, onComplete, onCancel }) => {
  const { docs: locations } = useFirestore('locations');
  const { executeTransfer, loading } = useQRTransfer();
  const { currentUser } = useAuth();
  
  const [selectedFromLocation, setSelectedFromLocation] = useState('');
  const [selectedToLocation, setSelectedToLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Transferência via QR Code');

  // Encontrar localizações onde o produto tem estoque
  const availableLocations = locations?.filter(location => {
    const stock = scannedProduct.locations?.[location.id] || 0;
    return stock > 0;
  }) || [];

  const handleTransfer = async () => {
    if (!selectedFromLocation || !selectedToLocation || !quantity) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (selectedFromLocation === selectedToLocation) {
      toast.error('Origem e destino devem ser diferentes');
      return;
    }

    const availableStock = scannedProduct.locations?.[selectedFromLocation] || 0;
    if (parseInt(quantity) > availableStock) {
      toast.error(`Estoque insuficiente. Disponível: ${availableStock}`);
      return;
    }

    const transferData = {
      productId: scannedProduct.id,
      fromLocationId: selectedFromLocation,
      toLocationId: selectedToLocation,
      quantity: parseInt(quantity),
      reason,
      userId: currentUser?.uid,
      productName: scannedProduct.name
    };

    const result = await executeTransfer(transferData);
    
    if (result.success) {
      toast.success(result.message);
      onComplete(result);
    } else {
      toast.error(result.error || 'Erro ao realizar transferência');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-green-700">
          <i className="fas fa-exchange-alt mr-2"></i>
          Transferência de Estoque
        </h3>
        
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <h4 className="font-medium text-lg">{scannedProduct.name}</h4>
          <p className="text-sm text-gray-600">
            SKU: {scannedProduct.sku} | 
            Estoque Total: {Object.values(scannedProduct.locations || {})
              .reduce((sum, qty) => sum + (Number(qty) || 0), 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Localização Origem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização Origem *
          </label>
          <select
            value={selectedFromLocation}
            onChange={(e) => setSelectedFromLocation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Selecione a origem...</option>
            {availableLocations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name} (Estoque: {scannedProduct.locations?.[location.id] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Localização Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização Destino *
          </label>
          <select
            value={selectedToLocation}
            onChange={(e) => setSelectedToLocation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Selecione o destino...</option>
            {locations?.filter(loc => loc.id !== selectedFromLocation).map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Quantidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantidade *
          </label>
          <input
            type="number"
            min="1"
            max={selectedFromLocation ? scannedProduct.locations?.[selectedFromLocation] || 0 : 0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="Digite a quantidade..."
          />
          {selectedFromLocation && (
            <p className="text-xs text-gray-500 mt-1">
              Máximo: {scannedProduct.locations?.[selectedFromLocation] || 0}
            </p>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            placeholder="Motivo da transferência..."
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleTransfer}
          disabled={loading || !selectedFromLocation || !selectedToLocation || !quantity}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Processando...
            </>
          ) : (
            <>
              <i className="fas fa-check mr-2"></i>
              Confirmar Transferência
            </>
          )}
        </button>
        
        <button
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 
                     disabled:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default QRTransferInterface;

// ==========================================
// 3. INTERFACE DE SAÍDA DE ESTOQUE
// ==========================================

// components/qr/QRExitInterface.jsx
import React, { useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { useQRStockExit } from '../../hooks/qr/useQRStockExit';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const QRExitInterface = ({ scannedProduct, onComplete, onCancel }) => {
  const { docs: locations } = useFirestore('locations');
  const { executeStockExit, loading } = useQRStockExit();
  const { currentUser } = useAuth();
  
  const [selectedLocation, setSelectedLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [exitType, setExitType] = useState('sale');
  const [reason, setReason] = useState('');
  const [customerInfo, setCustomerInfo] = useState('');

  const exitTypes = [
    { value: 'sale', label: 'Venda/Consumo', icon: 'fa-shopping-cart', color: 'green' },
    { value: 'loss', label: 'Perda/Dano', icon: 'fa-exclamation-triangle', color: 'red' },
    { value: 'adjustment', label: 'Ajuste', icon: 'fa-edit', color: 'blue' },
    { value: 'transfer_external', label: 'Transferência Externa', icon: 'fa-truck', color: 'purple' }
  ];

  // Localizações com estoque disponível
  const availableLocations = locations?.filter(location => {
    const stock = scannedProduct.locations?.[location.id] || 0;
    return stock > 0;
  }) || [];

  const handleStockExit = async () => {
    if (!selectedLocation || !quantity || !exitType) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const availableStock = scannedProduct.locations?.[selectedLocation] || 0;
    if (parseInt(quantity) > availableStock) {
      toast.error(`Estoque insuficiente. Disponível: ${availableStock}`);
      return;
    }

    const exitData = {
      productId: scannedProduct.id,
      locationId: selectedLocation,
      quantity: parseInt(quantity),
      exitType,
      reason: reason || `${exitTypes.find(t => t.value === exitType)?.label} via QR Code`,
      customerInfo: customerInfo || null,
      userId: currentUser?.uid,
      productName: scannedProduct.name
    };

    const result = await executeStockExit(exitData);
    
    if (result.success) {
      toast.success(result.message);
      onComplete(result);
    } else {
      toast.error(result.error || 'Erro ao registrar saída');
    }
  };

  const selectedExitType = exitTypes.find(t => t.value === exitType);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-red-700">
          <i className="fas fa-sign-out-alt mr-2"></i>
          Saída de Estoque
        </h3>
        
        <div className="bg-red-50 p-4 rounded border border-red-200">
          <h4 className="font-medium text-lg">{scannedProduct.name}</h4>
          <p className="text-sm text-gray-600">
            SKU: {scannedProduct.sku} | 
            Estoque Total: {Object.values(scannedProduct.locations || {})
              .reduce((sum, qty) => sum + (Number(qty) || 0), 0)}
          </p>
        </div>
      </div>

      {/* Tipo de Saída */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Saída *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {exitTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setExitType(type.value)}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                exitType === type.value
                  ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <i className={`fas ${type.icon} text-lg mb-1 block`}></i>
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Localização */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localização *
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Selecione a localização...</option>
            {availableLocations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name} (Estoque: {scannedProduct.locations?.[location.id] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Quantidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantidade *
          </label>
          <input
            type="number"
            min="1"
            max={selectedLocation ? scannedProduct.locations?.[selectedLocation] || 0 : 0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            placeholder="Digite a quantidade..."
          />
          {selectedLocation && (
            <p className="text-xs text-gray-500 mt-1">
              Máximo: {scannedProduct.locations?.[selectedLocation] || 0}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Motivo/Observação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo/Observação
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            placeholder={`Motivo da ${selectedExitType?.label.toLowerCase()}...`}
          />
        </div>

        {/* Info Cliente (apenas para venda) */}
        {exitType === 'sale' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente/Mesa
            </label>
            <input
              type="text"
              value={customerInfo}
              onChange={(e) => setCustomerInfo(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              placeholder="Nome do cliente ou mesa..."
            />
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleStockExit}
          disabled={loading || !selectedLocation || !quantity || !exitType}
          className="flex-1 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Processando...
            </>
          ) : (
            <>
              <i className="fas fa-check mr-2"></i>
              Confirmar Saída
            </>
          )}
        </button>
        
        <button
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 
                     disabled:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default QRExitInterface;

// ==========================================
// 4. PÁGINA PRINCIPAL EXPANDIDA
// ==========================================

// pages/qr/QRMultiOperationPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import QRScanner from '../../components/qr/QRScanner';
import QROperationSelector from '../../components/qr/QROperationSelector';
import QRCountingInterface from '../../components/qr/QRCountingInterface';
import QRTransferInterface from '../../components/qr/QRTransferInterface';
import QRExitInterface from '../../components/qr/QRExitInterface';
import { validateQRCodeData } from '../../utils/qr/qrCodeUtils';
import toast from 'react-hot-toast';

const QRMultiOperationPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { docs: products } = useFirestore('products');
  const { docs: locations } = useFirestore('locations');
  
  const [scannerActive, setScannerActive] = useState(true);
  const [scannedData, setScannedData] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [recentOperations, setRecentOperations] = useState([]);

  // Inicializar sessão
  useEffect(() => {
    setSessionData({
      id: `qr_multi_session_${Date.now()}`,
      startTime: new Date(),
      userId: currentUser?.uid,
      operations: [],
      status: 'active'
    });
  }, [currentUser]);

  const handleQRScan = async (qrData) => {
    setScannerActive(false);
    
    // Validar QR Code
    const validation = validateQRCodeData(qrData);
    if (!validation.valid) {
      toast.error(`QR Code inválido: ${validation.error}`);
      setScannerActive(true);
      return;
    }

    try {
      let productData = null;
      let locationData = null;

      // Processar diferentes tipos de QR Code
      switch (qrData.type) {
        case 'product':
          productData = products?.find(p => p.id === qrData.productId);
          break;
        
        case 'location':
          locationData = locations?.find(l => l.id === qrData.locationId);
          break;
        
        case 'product_location':
          productData = products?.find(p => p.id === qrData.productId);
          locationData = locations?.find(l => l.id === qrData.locationId);
          break;
        
        case 'simple':
          productData = products?.find(p => 
            p.id === qrData.data || 
            p.sku === qrData.data ||
            p.barcode === qrData.data
          );
          break;
      }

      if (!productData && qrData.type !== 'location') {
        toast.error('Produto não encontrado no sistema');
        setScannerActive(true);
        return;
      }

      setScannedData({
        ...qrData,
        product: productData,
        location: locationData,
        timestamp: new Date()
      });

      toast.success('QR Code escaneado com sucesso!');

    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
      toast.error('Erro ao processar QR Code');
      setScannerActive(true);
    }
  };

  const handleOperationSelect = (operationType) => {
    setSelectedOperation(operationType);
  };

  const handleOperationComplete = (result) => {
    // Adicionar operação à sessão
    const operation = {
      type: selectedOperation,
      product: scannedData.product,
      result,
      timestamp: new Date()
    };

    setSessionData(prev => ({
      ...prev,
      operations: [...prev.operations, operation]
    }));

    // Adicionar às operações recentes
    setRecentOperations(prev => [operation, ...prev.slice(0, 9)]);

    // Resetar para novo scan
    setScannedData(null);
    setSelectedOperation(null);
    setScannerActive(true);

    toast.success('Operação concluída com sucesso!');
  };

  const handleCancel = () => {
    setScannedData(null);
    setSelectedOperation(null);
    setScannerActive(true);
  };

  const renderCurrentInterface = () => {
    if (!scannedData) {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-4">Scanner QR Code</h3>
          <QRScanner 
            onScan={handleQRScan} 
            isActive={scannerActive}
            height="400px"
            className="border-2 border-gray-200 rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-2 text-center">
            Escaneie um QR Code para iniciar
          </p>
        </div>
      );
    }

    if (!selectedOperation) {
      return (
        <QROperationSelector
          scannedProduct={scannedData.product}
          onSelectOperation={handleOperationSelect}
          onCancel={handleCancel}
        />
      );
    }

    switch (selectedOperation) {
      case 'count':
        return (
          <QRCountingInterface
            scannedData={scannedData}
            onComplete={handleOperationComplete}
            onCancel={handleCancel}
          />
        );
      
      case 'transfer':
        return (
          <QRTransferInterface
            scannedProduct={scannedData.product}
            onComplete={handleOperationComplete}
            onCancel={handleCancel}
          />
        );
      
      case 'exit':
        return (
          <QRExitInterface
            scannedProduct={scannedData.product}
            onComplete={handleOperationComplete}
            onCancel={handleCancel}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          QR Code Multi-Operações
        </h1>
        <p className="text-gray-600">
          Escaneie QR Codes para contagem, transferência ou saída de estoque
        </p>
      </div>

      {/* Informações da Sessão */}
      {sessionData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-800">Sessão Ativa</h3>
              <p className="text-blue-600 text-sm">
                Início: {sessionData.startTime.toLocaleTimeString()} | 
                Operações: {sessionData.operations.length}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/qr-reports')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Ver Relatórios
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interface Principal */}
        <div className="lg:col-span-2">
          {renderCurrentInterface()}
        </div>

        {/* Painel Lateral */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Operações Recentes</h3>
          
          {/* Sessão Atual */}
          {sessionData?.operations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-green-700">Sessão Atual</h4>
              <div className="space-y-2">
                {sessionData.operations.slice(-5).reverse().map((operation, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded border ${
                      operation.type === 'count' ? 'bg-blue-50 border-blue-200' :
                      operation.type === 'transfer' ? 'bg-green-50 border-green-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="font-medium text-sm">
                      {operation.product?.name || 'Produto não identificado'}
                    </p>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="capitalize">{operation.type}</span>
                      <span>{operation.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estatísticas Rápidas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium mb-3">Estatísticas da Sessão</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Contagens:</span>
                <span className="font-medium">
                  {sessionData?.operations.filter(op => op.type === 'count').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transferências:</span>
                <span className="font-medium">
                  {sessionData?.operations.filter(op => op.type === 'transfer').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Saídas:</span>
                <span className="font-medium">
                  {sessionData?.operations.filter(op => op.type === 'exit').length || 0}
                </span>
              </div>
            </div>
          </div>

          {recentOperations.length === 0 && sessionData?.operations.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-2">
                <i className="fas fa-qrcode text-3xl"></i>
              </div>
              <p className="text-gray-600">Nenhuma operação realizada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRMultiOperationPage;

// ==========================================
// 5. HOOK DE TRANSFERÊNCIA COMPLETO
// ==========================================

// hooks/qr/useQRTransfer.js
import { useState } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment,
  serverTimestamp,
  runTransaction 
} from 'firebase/firestore';

export const useQRTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeTransfer = async (transferData) => {
    setLoading(true);
    setError(null);

    try {
      const {
        productId,
        fromLocationId,
        toLocationId,
        quantity,
        userId,
        reason = 'Transferência via QR Code',
        productName
      } = transferData;

      // Usar transação para garantir consistência
      const result = await runTransaction(db, async (transaction) => {
        // 1. Verificar estoque origem
        const fromStockRef = doc(db, 'stock', `${productId}_${fromLocationId}`);
        const fromStockDoc = await transaction.get(fromStockRef);
        
        if (!fromStockDoc.exists()) {
          throw new Error('Produto não encontrado na localização origem');
        }

        const currentStock = fromStockDoc.data().quantity || 0;
        if (currentStock < quantity) {
          throw new Error(`Estoque insuficiente. Disponível: ${currentStock}`);
        }

        // 2. Criar registro de movimentação
        const movementRef = doc(collection(db, 'movements'));
        const movementData = {
          type: 'transfer',
          productId,
          productName,
          fromLocationId,
          toLocationId,
          quantity: parseInt(quantity),
          reason,
          userId,
          method: 'qr_code',
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp()
        };

        transaction.set(movementRef, movementData);

        // 3. Atualizar estoque origem (diminuir)
        transaction.update(fromStockRef, {
          quantity: increment(-quantity),
          lastMovement: serverTimestamp(),
          lastMovementType: 'transfer_out'
        });

        // 4. Atualizar/criar estoque destino (aumentar)
        const toStockRef = doc(db, 'stock', `${productId}_${toLocationId}`);
        const toStockDoc = await transaction.get(toStockRef);

        if (toStockDoc.exists()) {
          transaction.update(toStockRef, {
            quantity: increment(quantity),
            lastMovement: serverTimestamp(),
            lastMovementType: 'transfer_in'
          });
        } else {
          transaction.set(toStockRef, {
            productId,
            locationId: toLocationId,
            quantity: parseInt(quantity),
            lastMovement: serverTimestamp(),
            lastMovementType: 'transfer_in',
            createdAt: serverTimestamp()
          });
        }

        return movementRef.id;
      });

      return {
        success: true,
        movementId: result,
        message: `Transferência de ${quantity} unidades realizada com sucesso!`
      };

    } catch (error) {
      console.error('Erro na transferência:', error);
      const errorMessage = error.message || 'Erro ao realizar transferência';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { executeTransfer, loading, error };
};

// ==========================================
// 6. HOOK DE SAÍDA DE ESTOQUE COMPLETO
// ==========================================

// hooks/qr/useQRStockExit.js
import { useState } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment,
  serverTimestamp,
  runTransaction 
} from 'firebase/firestore';

export const useQRStockExit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeStockExit = async (exitData) => {
    setLoading(true);
    setError(null);

    try {
      const {
        productId,
        locationId,
        quantity,
        exitType, // 'sale', 'loss', 'adjustment', 'transfer_external'
        reason,
        customerInfo = null,
        userId,
        productName
      } = exitData;

      // Usar transação para garantir consistência
      const result = await runTransaction(db, async (transaction) => {
        // 1. Verificar estoque disponível
        const stockRef = doc(db, 'stock', `${productId}_${locationId}`);
        const stockDoc = await transaction.get(stockRef);
        
        if (!stockDoc.exists()) {
          throw new Error('Produto não encontrado na localização especificada');
        }

        const currentStock = stockDoc.data().quantity || 0;
        if (currentStock < quantity) {
          throw new Error(`Estoque insuficiente. Disponível: ${currentStock}`);
        }

        // 2. Criar registro de saída
        const exitRef = doc(collection(db, 'stock_exits'));
        const exitRecord = {
          type: 'exit',
          subType: exitType,
          productId,
          productName,
          locationId,
          quantity: parseInt(quantity),
          reason: reason || `${exitType} via QR Code`,
          customerInfo,
          userId,
          method: 'qr_code',
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp()
        };

        transaction.set(exitRef, exitRecord);

        // 3. Atualizar estoque (diminuir)
        transaction.update(stockRef, {
          quantity: increment(-quantity),
          lastMovement: serverTimestamp(),
          lastMovementType: exitType
        });

        // 4. Registrar movimentação
        const movementRef = doc(collection(db, 'movements'));
        const movementData = {
          type: 'exit',
          subType: exitType,
          productId,
          productName,
          locationId,
          quantity: parseInt(quantity),
          reason: reason || `${exitType} via QR Code`,
          customerInfo,
          userId,
          method: 'qr_code',
          exitId: exitRef.id,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp()
        };

        transaction.set(movementRef, movementData);

        return exitRef.id;
      });

      const exitTypeLabels = {
        sale: 'venda',
        loss: 'perda',
        adjustment: 'ajuste',
        transfer_external: 'transferência externa'
      };

      return {
        success: true,
        exitId: result,
        message: `Saída por ${exitTypeLabels[exitType]} de ${quantity} unidades registrada com sucesso!`
      };

    } catch (error) {
      console.error('Erro na saída:', error);
      const errorMessage = error.message || 'Erro ao registrar saída';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { executeStockExit, loading, error };
};

export default {
  QROperationSelector,
  QRTransferInterface,
  QRExitInterface,
  QRMultiOperationPage,
  useQRTransfer,
  useQRStockExit
};
