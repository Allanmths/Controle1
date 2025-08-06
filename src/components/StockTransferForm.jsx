import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { db } from '../services/firebase';
import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ProductSelector from './ProductSelector';
import useFirestore from '../hooks/useFirestore';
import { FaExchangeAlt } from 'react-icons/fa';

const StockTransferForm = () => {
    const { user, userData, loading: authLoading } = useAuth();
    const { docs: locations } = useFirestore('locations', { field: 'name', direction: 'asc' });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [quantity, setQuantity] = useState('');

    const availableStock = selectedProduct && fromLocationId ? selectedProduct.locations?.[fromLocationId] || 0 : 0;

    useEffect(() => {
        // Reset form when product changes
        setFromLocationId('');
        setToLocationId('');
        setQuantity('');
    }, [selectedProduct]);

        const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error("Usuário não autenticado. Por favor, faça login novamente.");
            return;
        }

        if (!selectedProduct || !fromLocationId || !toLocationId || !quantity) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }
        if (fromLocationId === toLocationId) {
            toast.error("A localidade de origem e destino não podem ser iguais.");
            return;
        }
        if (Number(quantity) <= 0) {
            toast.error("A quantidade deve ser maior que zero.");
            return;
        }
        if (Number(quantity) > availableStock) {
            toast.error(`Estoque insuficiente na origem. DisponÃ­vel: ${availableStock}`);
            return;
        }
        
        const transferQuantity = Number(quantity);
        const toastId = toast.loading('Processando Transferência...');

        try {
            await runTransaction(db, async (transaction) => {
                const productRef = doc(db, 'products', selectedProduct.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error("Produto não encontrado!");
                }

                const productData = productDoc.data();
                const currentFromStock = productData.locations?.[fromLocationId] || 0;

                if (currentFromStock < transferQuantity) {
                    throw new Error(`Estoque insuficiente na origem. DisponÃ­vel: ${currentFromStock}`);
                }

                const newFromStock = currentFromStock - transferQuantity;
                const newToStock = (productData.locations?.[toLocationId] || 0) + transferQuantity;

                // 1. Atualizar o estoque do produto
                transaction.update(productRef, {
                    [`locations.${fromLocationId}`]: newFromStock,
                    [`locations.${toLocationId}`]: newToStock,
                    // O totalStock não muda na Transferência
                });

                // 2. Registrar movimento de SAÃDA no Kardex
                const kardexExitRef = doc(collection(db, 'kardex'));
                transaction.set(kardexExitRef, {
                    productId: selectedProduct.id,
                    productName: productData.name,
                    locationId: fromLocationId,
                    type: 'transfer_out',
                    quantity: transferQuantity,
                    previousStock: currentFromStock,
                    newStock: newFromStock,
                    timestamp: serverTimestamp(),
                    userId: user.uid,
                    userEmail: userData?.email,
                    details: `Transferência para local ${toLocationId}`
                });

                // 3. Registrar movimento de ENTRADA no Kardex
                const kardexEntryRef = doc(collection(db, 'kardex'));
                transaction.set(kardexEntryRef, {
                    productId: selectedProduct.id,
                    productName: productData.name,
                    locationId: toLocationId,
                    type: 'transfer_in',
                    quantity: transferQuantity,
                    previousStock: (productData.locations?.[toLocationId] || 0),
                    newStock: newToStock,
                    timestamp: serverTimestamp(),
                    userId: user.uid,
                    userEmail: userData?.email,
                    details: `Transferência de local ${fromLocationId}`
                });
            });

            toast.success('Transferência realizada com sucesso!', { id: toastId });
            // Resetar o formulÃ¡rio
            setSelectedProduct(null);
            setFromLocationId('');
            setToLocationId('');
            setQuantity('');

        } catch (error) {
            console.error("Erro na Transferência: ", error);
            toast.error(error.message || 'Falha ao realizar a Transferência.', { id: toastId });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Transferência de Estoque</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <ProductSelector 
                    onProductSelect={setSelectedProduct} 
                    selectedProductId={selectedProduct?.id}
                    placeholder="Buscar produto para transferir..." 
                />

                {selectedProduct && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label htmlFor="from-location-transfer" className="block text-sm font-medium text-gray-700 mb-1">De</label>
                                <select id="from-location-transfer" value={fromLocationId} onChange={e => setFromLocationId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                    <option value="">Selecione a origem</option>
                                    {locations && locations.length > 0 ? (
                                        locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {`${loc.name} (Disp: ${selectedProduct.locations?.[loc.id] || 0})`}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Carregando localidades...</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="to-location-transfer" className="block text-sm font-medium text-gray-700 mb-1">Para</label>
                                <select id="to-location-transfer" value={toLocationId} onChange={e => setToLocationId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                    <option value="">Selecione o destino</option>
                                    {locations && locations.length > 0 ? (
                                        locations.filter(l => l.id !== fromLocationId).map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Carregando localidades...</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="quantity-transfer" className="block text-sm font-medium text-gray-700 mb-1">Quantidade a Transferir</label>
                            <input type="number" id="quantity-transfer" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" max={availableStock > 0 ? availableStock : undefined} placeholder={`Máx: ${availableStock}`} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={!selectedProduct || !fromLocationId || !toLocationId || !quantity || authLoading} 
                                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                <FaExchangeAlt />
                                {authLoading ? 'Verificando...' : 'Confirmar Transferência'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default StockTransferForm;
