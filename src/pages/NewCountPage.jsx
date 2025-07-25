import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { useOfflineMode } from '../hooks/useOfflineMode';
import toast from 'react-hot-toast';
import { FaWifi, FaBan, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

export default function NewCountPage() {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { currentUser } = useAuth();
    const { isOnline, saveOfflineCount, cacheDataForOffline } = useOfflineMode();
    const navigate = useNavigate();
    
    const [countedQuantities, setCountedQuantities] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (products && products.length > 0) {
            const initialQuantities = products.reduce((acc, product) => {
                acc[product.id] = ''; // Use empty string for placeholder
                return acc;
            }, {});
            setCountedQuantities(initialQuantities);
            
            // Cache produtos para uso offline
            cacheDataForOffline('products', products);
        }
    }, [products, cacheDataForOffline]);

    const handleQuantityChange = (productId, value) => {
        setCountedQuantities(prev => ({
            ...prev,
            [productId]: value === '' ? '' : Number(value)
        }));
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFinalizeCount = async () => {
        if (Object.values(countedQuantities).some(qty => qty === '')) {
            if (!window.confirm('Existem produtos com quantidade nÃ£o preenchida (serÃ£o contados como 0). Deseja continuar?')) {
                return;
            }
        }
        
        setLoading(true);
        
        const countDetails = (products || []).map(product => ({
            productId: product.id,
            productName: product.name,
            expectedQuantity: product.totalQuantity || 0,
            countedQuantity: countedQuantities[product.id] === '' ? 0 : countedQuantities[product.id],
        }));

        const countData = {
            createdAt: isOnline ? serverTimestamp() : new Date(),
            userEmail: currentUser?.email || 'N/A',
            userName: currentUser?.displayName || currentUser?.email || 'N/A',
            status: isOnline ? 'concluido' : 'offline',
            details: countDetails,
            totalProducts: countDetails.length,
            timestamp: new Date().toISOString()
        };

        try {
            if (isOnline) {
                // Salvar online no Firebase
                await addDoc(collection(db, 'counts'), countData);
                toast.success('Contagem finalizada e salva com sucesso!');
            } else {
                // Salvar offline no IndexedDB
                const success = await saveOfflineCount(countData);
                if (!success) {
                    throw new Error('Falha ao salvar offline');
                }
            }
            
            navigate('/counting');
        } catch (error) {
            console.error('Error finalizing count:', error);
            const errorMessage = isOnline 
                ? 'Falha ao finalizar a contagem. Tente novamente.'
                : 'Falha ao salvar contagem offline. Verifique o armazenamento do dispositivo.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingProducts) {
        return <p className="text-center p-4">Carregando produtos...</p>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Nova Contagem de Estoque</h2>
                    <div className="flex items-center mt-2 space-x-4">
                        <div className={`flex items-center space-x-2 text-sm ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                            {isOnline ? <FaWifi /> : <FaBan />}
                            <span>{isOnline ? 'Online' : 'Modo Offline'}</span>
                        </div>
                        {!isOnline && (
                            <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                Dados serÃ£o salvos localmente
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <p className="mb-6 text-gray-600">
                Insira a quantidade contada para cada produto. Itens nÃ£o preenchidos serÃ£o considerados como 0.
                {!isOnline && ' A contagem serÃ¡ sincronizada quando a conexÃ£o for restaurada.'}
            </p>
            
            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar produto pelo nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. no Sistema</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Contada</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts && filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.totalQuantity || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                        <input 
                                            type="number"
                                            min="0"
                                            value={countedQuantities[product.id] || ''}
                                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                            className="w-24 p-2 border border-gray-300 rounded-md"
                                            placeholder="Qtd."
                                        />
                                    </td>
                                </tr>
                            ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Carregando produtos...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
                <button 
                    onClick={() => navigate('/counting')}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleFinalizeCount}
                    disabled={loading}
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
    );
}
