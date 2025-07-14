import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';

export default function NewCountPage() {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [countedQuantities, setCountedQuantities] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (products.length > 0) {
            const initialQuantities = products.reduce((acc, product) => {
                acc[product.id] = ''; // Use empty string for placeholder
                return acc;
            }, {});
            setCountedQuantities(initialQuantities);
        }
    }, [products]);

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
            if (!window.confirm('Existem produtos com quantidade não preenchida (serão contados como 0). Deseja continuar?')) {
                return;
            }
        }
        
        setLoading(true);
        
        const countDetails = products.map(product => ({
            productId: product.id,
            productName: product.name,
            expectedQuantity: product.totalQuantity || 0,
            countedQuantity: countedQuantities[product.id] === '' ? 0 : countedQuantities[product.id],
        }));

        try {
            await addDoc(collection(db, 'counts'), {
                createdAt: serverTimestamp(),
                userEmail: currentUser?.email || 'N/A',
                status: 'concluido',
                details: countDetails,
            });
            alert('Contagem finalizada e salva com sucesso!');
            navigate('/counting');
        } catch (error) {
            console.error('Error finalizing count:', error);
            alert('Falha ao finalizar a contagem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingProducts) {
        return <p className="text-center p-4">Carregando produtos...</p>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Nova Contagem de Estoque</h2>
            <p className="mb-6 text-gray-600">Insira a quantidade contada para cada produto. Itens não preenchidos serão considerados como 0.</p>
            
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar produto pelo nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
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
                            {filteredProducts.map(product => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
                <button 
                    onClick={() => navigate('/counting')}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleFinalizeCount}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                >
                    {loading ? 'Finalizando...' : 'Finalizar Contagem'}
                </button>
            </div>
        </div>
    );
}
