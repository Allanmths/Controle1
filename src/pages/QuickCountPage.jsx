import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
// Offline removido
import toast from 'react-hot-toast';
import { FaWifi, FaBan, FaSearch, FaSave, FaBarcode, FaHistory } from 'react-icons/fa';

export default function QuickCountPage() {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    // Fallback seguro para categories
    const { docs: _categories, loading: loadingCategories } = useFirestore('categories');
    // Fallback seguro para categories em todo o componente
    const categories = Array.isArray(_categories) ? _categories : [];
    // Função utilitária para garantir array
    const getCategoriesSafe = () => Array.isArray(categories) ? categories : [];
    const { currentUser } = useAuth();
    // Sempre online
    const navigate = useNavigate();

    const [countedQuantities, setCountedQuantities] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [recentProducts, setRecentProducts] = useState([]);
    const [countMode, setCountMode] = useState('barcode'); // 'barcode' ou 'manual'
    // Novo estado para saber se IndexedDB está pronto
    // dbReady removido

    // Detecta quando o offlineData muda (ou seja, IndexedDB carregou)
    // Nenhum controle de dbReady ou offlineData

    useEffect(() => {
        if (products && products.length > 0) {
            const initialQuantities = products.reduce((acc, product) => {
                acc[product.id] = '';
                return acc;
            }, {});
            setCountedQuantities(initialQuantities);
        }
    }, [products]);
    
    // Cache categorias para uso offline
    // Nenhum cache offline de categorias

    const handleQuantityChange = (productId, value) => {
        setCountedQuantities(prev => ({
            ...prev,
            [productId]: value === '' ? '' : Number(value)
        }));

        // Se o produto não estiver nos recentes, adicione-o
        const product = products.find(p => p.id === productId);
        if (product && !recentProducts.some(p => p.id === productId)) {
            setRecentProducts(prev => {
                const updated = [product, ...prev].slice(0, 5); // Mantém apenas os 5 mais recentes
                return updated;
            });
        }
    };

    const handleBarcodeSearch = () => {
        return (
            <div>
                {/* TODO: Coloque todo o conteúdo JSX do componente aqui, garantindo que tudo esteja dentro deste <div> */}
                {/* ...existing code... */}
            </div>
        );
    };

    const handleFinalizeCount = async () => {
        setLoading(true);
        // Preparar dados da contagem
        const countDetails = Object.entries(countedQuantities)
            .filter(([_, qty]) => qty !== '')
            .map(([productId, qty]) => {
                const product = products.find(p => p.id === productId) || {};
                return {
                    productId,
                    productName: product.name || 'Produto Desconhecido',
                    expectedQuantity: product.totalQuantity || 0,
                    countedQuantity: qty,
                };
            });
        const countData = {
            createdAt: serverTimestamp(),
            userEmail: currentUser?.email || 'N/A',
            userName: currentUser?.displayName || currentUser?.email || 'N/A',
            status: 'concluido',
            details: countDetails,
            totalProducts: countDetails.length,
            timestamp: new Date().toISOString(),
            countType: 'quick'
        };
        try {
            await addDoc(collection(db, 'counts'), countData);
            toast.success('Contagem rápida finalizada e salva com sucesso!');
            navigate('/counting');
        } catch (error) {
            console.error('Erro ao finalizar contagem:', error);
            toast.error('Falha ao finalizar a contagem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingProducts || loadingCategories) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center p-4">Carregando dados...</div>
            </div>
        );
    }

    // Filtro de produtos para busca manual
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Contagem Rápida</h2>
                    <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                            <FaWifi />
                            <span>Online</span>
                        </div>
                    </div>
                </div>
            </div>
            <p className="mb-4 text-gray-600">
                Escaneie códigos de barras ou pesquise produtos para uma contagem rápida.
                {!isOnline && ' A contagem será sincronizada quando a conexão for restaurada.'}
            </p>
            <div className="flex space-x-2 mb-4">
                <button 
                    onClick={() => setCountMode('barcode')} 
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                        countMode === 'barcode' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-800'
                    }`}
                    disabled={loading || (!isOnline && !dbReady)}
                >
                    <FaBarcode />
                    <span>Código de Barras</span>
                </button>
                <button 
                    onClick={() => setCountMode('manual')} 
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                        countMode === 'manual' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-800'
                    }`}
                    disabled={loading || (!isOnline && !dbReady)}
                >
                    <FaSave />
                    <span>Manual</span>
                </button>
            </div>
            {countMode === 'barcode' ? (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                        <div className="flex-grow">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaBarcode className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Código de barras ou SKU..."
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleBarcodeSearch}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Buscar
                        </button>
                    </div>
                    {/* Produtos recentes */}
                    {recentProducts.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 flex items-center">
                                <FaHistory className="mr-2" /> Produtos recentes
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {recentProducts.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductSelect(product)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full transition-colors"
                                    >
                                        {product.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="mb-4 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar produto pelo nome ou código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                    </div>
                    {searchTerm && (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.slice(0, 10).map(product => (
                                    <div 
                                        key={product.id}
                                        onClick={() => handleProductSelect(product)}
                                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                                    >
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {product.sku && <span className="mr-3">SKU: {product.sku}</span>}
                                            {product.barcode && <span>Cód: {product.barcode}</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-gray-500">
                                    Nenhum produto encontrado
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {selectedProduct && (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <h3 className="text-xl font-medium mb-4">Produto Selecionado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-2">
                            <h4 className="text-lg font-medium">{selectedProduct.name}</h4>
                            <div className="text-sm text-gray-500 mt-1">
                                {selectedProduct.sku && <span className="mr-3">SKU: {selectedProduct.sku}</span>}
                                {selectedProduct.barcode && <span className="mr-3">Código: {selectedProduct.barcode}</span>}
                                <span>Estoque atual: {selectedProduct.totalQuantity || 0}</span>
                            </div>
                            {selectedProduct.category && (
                                <div className="mt-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                        {selectedProduct.category}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="quantity-input" className="block text-sm font-medium text-gray-700 mb-1">
                                Quantidade Contada:
                            </label>
                            <div className="flex items-center">
                                <input
                                    id="quantity-input"
                                    type="number"
                                    min="0"
                                    value={countedQuantities[selectedProduct.id] || ''}
                                    onChange={(e) => handleQuantityChange(selectedProduct.id, e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Quantidade"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setSelectedProduct(null);
                                            if (countMode === 'barcode') {
                                                // Foca de volta no input de código de barras
                                                const barcodeInput = document.querySelector('input[placeholder="Código de barras ou SKU..."]');
                                                if (barcodeInput) barcodeInput.focus();
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-6 flex justify-between">
                <div>
                    <span className="text-gray-700 font-medium">
                        {Object.values(countedQuantities).filter(qty => qty !== '').length} produtos contados
                    </span>
                </div>
                <div className="flex space-x-4">
                    <button 
                        onClick={() => navigate('/counting')}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleFinalizeCount}
                        disabled={loading || Object.values(countedQuantities).every(qty => qty === '')}
                        className={`px-6 py-2 text-white rounded-md font-medium flex items-center space-x-2 transition-colors ${
                            isOnline 
                                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300' 
                                : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300'
                        }`}
                    >
                        <FaSave />
                        <span>
                            {loading 
                                ? 'Salvando...' 
                                : isOnline 
                                    ? 'Finalizar Contagem' 
                                    : 'Salvar Offline'
                            }
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
