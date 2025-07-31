import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { useOfflineMode } from '../hooks/useOfflineMode';
import toast from 'react-hot-toast';
import { FaWifi, FaBan, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch, FaSave, FaMapMarkerAlt } from 'react-icons/fa';

export default function NewCountPage() {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { docs: locations, loading: loadingLocations } = useFirestore('locations');
    const { currentUser } = useAuth();
    const { isOnline } = useOfflineMode();
    const navigate = useNavigate();
    
    const [countedQuantities, setCountedQuantities] = useState({});
    const [selectedLocation, setSelectedLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (products && products.length > 0) {
            // Inicializa objeto de quantidades contadas com estrutura para localidades
            const initialQuantities = products.reduce((acc, product) => {
                // Para cada produto, criamos um objeto que armazenará quantidades por localidade
                acc[product.id] = {};
                return acc;
            }, {});
            setCountedQuantities(initialQuantities);
            
            // Cache produtos para uso offline
            // ...
        }
    }, [products]);

    useEffect(() => {
        if (locations && locations.length > 0) {
            // Cache localidades para uso offline
            // ...
        }
    }, [locations]);

    const handleQuantityChange = (productId, locationId, value) => {
        setCountedQuantities(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [locationId]: value === '' ? '' : Number(value)
            }
        }));
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFinalizeCount = async () => {
        if (!selectedLocation) {
            toast.error('Selecione uma localidade para a contagem');
            return;
        }
        
        // Verifica se existe algum produto com quantidade preenchida
        const hasFilledQuantities = Object.keys(countedQuantities).some(productId => {
            const locationQuantity = countedQuantities[productId][selectedLocation];
            return locationQuantity !== undefined && locationQuantity !== '';
        });

        if (!hasFilledQuantities) {
            toast.error('Preencha a quantidade de pelo menos um produto');
            return;
        }
        
        setLoading(true);
        
        // Prepara os detalhes da contagem, incluindo apenas produtos com quantidades preenchidas
        const countDetails = products.reduce((details, product) => {
            const countedQty = countedQuantities[product.id]?.[selectedLocation];
            
            // Se tem quantidade preenchida, adiciona aos detalhes
            if (countedQty !== undefined && countedQty !== '') {
                // Calcula a quantidade esperada na localidade específica
                const locationStock = product.locations?.[selectedLocation] || 0;
                
                details.push({
                    productId: product.id,
                    productName: product.name,
                    locationId: selectedLocation,
                    locationName: locations.find(loc => loc.id === selectedLocation)?.name || 'Desconhecida',
                    expectedQuantity: locationStock,
                    countedQuantity: parseInt(countedQty, 10), // Garantir que é um número
                    productCode: product.code || null,
                    category: product.categoryId ? categories.find(c => c.id === product.categoryId)?.name : null,
                });
            }
            
            return details;
        }, []);

        // Dados da contagem
        const countData = {
            createdAt: isOnline ? serverTimestamp() : new Date(),
            userEmail: currentUser?.email || 'N/A',
            userName: currentUser?.displayName || currentUser?.email || 'N/A',
            status: isOnline ? 'concluido' : 'offline',
            details: countDetails,
            totalProducts: countDetails.length,
            timestamp: new Date().toISOString(),
            locationId: selectedLocation,
            locationName: locations.find(loc => loc.id === selectedLocation)?.name || 'Desconhecida',
            countType: 'location',  // Indica que é uma contagem por localidade
            fileId: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}` // ID único para referência futura
        };

        try {
            if (isOnline) {
                // Salvar online no Firebase
                await addDoc(collection(db, 'counts'), countData);
                toast.success('Contagem finalizada e salva com sucesso!');
            } else {
                // Salvar offline no IndexedDB
                // ...
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

    if (loadingProducts || loadingLocations) {
        return <p className="text-center p-4">Carregando dados...</p>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Nova Contagem por Localidade</h2>
                    <div className="flex items-center mt-2 space-x-4">
                        <div className={`flex items-center space-x-2 text-sm ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                            {isOnline ? <FaWifi /> : <FaBan />}
                            <span>{isOnline ? 'Online' : 'Modo Offline'}</span>
                        </div>
                        {!isOnline && (
                            <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                Dados serão salvos localmente
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-blue-600" />
                    Selecione a Localidade para Contagem
                </h3>
                
                {locations.length === 0 ? (
                    <p className="text-red-500">Não há localidades cadastradas. Por favor, cadastre localidades primeiro.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {locations.map(location => (
                            <button 
                                key={location.id}
                                onClick={() => setSelectedLocation(location.id)}
                                className={`p-3 border rounded-lg text-left transition-colors hover:bg-blue-50 ${
                                    selectedLocation === location.id 
                                        ? 'border-blue-600 bg-blue-50 shadow-sm' 
                                        : 'border-gray-300'
                                }`}
                            >
                                <span className="block font-medium">{location.name}</span>
                                {location.description && (
                                    <span className="text-sm text-gray-600">{location.description}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {selectedLocation && (
                <>
                    <p className="mb-6 text-gray-600">
                        Insira a quantidade contada para cada produto na localidade 
                        <span className="font-medium"> {locations.find(loc => loc.id === selectedLocation)?.name}</span>.
                        Itens não preenchidos não serão incluídos na contagem.
                        {!isOnline && ' A contagem será sincronizada quando a conexão for restaurada.'}
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. na Localidade</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Contada</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProducts && filteredProducts.length > 0 ? (
                                        filteredProducts.map(product => {
                                            const locationStock = product.locations?.[selectedLocation] || 0;
                                            return (
                                                <tr key={product.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{locationStock}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input 
                                                            type="number"
                                                            min="0"
                                                            value={countedQuantities[product.id]?.[selectedLocation] || ''}
                                                            onChange={(e) => handleQuantityChange(product.id, selectedLocation, e.target.value)}
                                                            className="w-24 p-2 border border-gray-300 rounded-md"
                                                            placeholder="Qtd."
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                {filteredProducts.length === 0 && searchTerm 
                                                    ? "Nenhum produto encontrado com esse termo de busca" 
                                                    : "Carregando produtos..."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <div className="mt-6 flex justify-end space-x-4">
                <button 
                    onClick={() => navigate('/counting')}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleFinalizeCount}
                    disabled={!selectedLocation || loading}
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
