import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { db } from '../services/firebase';
import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ProductSelector from './ProductSelector';
import useFirestore from '../hooks/useFirestore';
import { FaArrowCircleDown } from 'react-icons/fa';

const StockExitForm = () => {
    const { user, userData } = useAuth();
    const { docs: locations } = useFirestore('locations', { field: 'name', direction: 'asc' });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [fromLocationId, setFromLocationId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    
    // Lista de motivos predefinidos
    const exitReasons = [
        { value: 'consumo', label: 'Consumo' },
        { value: 'venda', label: 'Venda' },
        { value: 'perda', label: 'Perda/Quebra' },
        { value: 'vencimento', label: 'Vencimento' },
        { value: 'devolucao', label: 'Devolução ao Fornecedor' },
        { value: 'outro', label: 'Outro' }
    ];

    const availableStock = selectedProduct && fromLocationId ? selectedProduct.locations?.[fromLocationId] || 0 : 0;

    useEffect(() => {
        // Reset form when product changes
        setFromLocationId('');
        setQuantity('');
        setReason('');
        setCustomReason('');
    }, [selectedProduct]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct || !fromLocationId || !quantity) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }
        if (Number(quantity) <= 0) {
            toast.error("A quantidade deve ser maior que zero.");
            return;
        }
        if (Number(quantity) > availableStock) {
            toast.error(`Estoque insuficiente. Disponível: ${availableStock}`);
            return;
        }
        
        const exitQuantity = Number(quantity);
        const toastId = toast.loading('Processando saída de estoque...');

        try {
            await runTransaction(db, async (transaction) => {
                const productRef = doc(db, 'products', selectedProduct.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error("Produto não encontrado!");
                }

                const productData = productDoc.data();
                const currentStock = productData.locations?.[fromLocationId] || 0;

                if (currentStock < exitQuantity) {
                    throw new Error(`Estoque insuficiente. Disponível: ${currentStock}`);
                }

                const newStock = currentStock - exitQuantity;
                const newTotalStock = productData.totalStock - exitQuantity;

                // 1. Atualizar o estoque do produto
                transaction.update(productRef, {
                    [`locations.${fromLocationId}`]: newStock,
                    totalStock: newTotalStock,
                });

                // 2. Registrar movimento de SAÍDA no Kardex
                const kardexRef = doc(collection(db, 'kardex'));
                transaction.set(kardexRef, {
                    productId: selectedProduct.id,
                    productName: productData.name,
                    locationId: fromLocationId,
                    type: 'saida',
                    quantity: exitQuantity,
                    previousStock: currentStock,
                    newStock: newStock,
                    timestamp: serverTimestamp(),
                    userId: user.uid,
                    userEmail: userData?.email,
                    details: reason === 'outro' ? customReason : exitReasons.find(r => r.value === reason)?.label || 'Saída manual'
                });
            });

            toast.success('Saída de estoque registrada com sucesso!', { id: toastId });
            // Resetar o formulário
            setSelectedProduct(null);
            setFromLocationId('');
            setQuantity('');
            setReason('');
            setCustomReason('');

        } catch (error) {
            console.error("Erro na saída de estoque: ", error);
            toast.error(error.message || 'Falha ao registrar a saída.', { id: toastId });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Saída de Estoque</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <ProductSelector 
                    onProductSelect={setSelectedProduct} 
                    selectedProductId={selectedProduct?.id}
                    placeholder="Buscar produto para saída..." 
                />

                {selectedProduct && (
                    <>
                        <div>
                            <label htmlFor="from-location-exit" className="block text-sm font-medium text-gray-700 mb-1">Local de Origem</label>
                            <select id="from-location-exit" value={fromLocationId} onChange={e => setFromLocationId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
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
                            <label htmlFor="quantity-exit" className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <input type="number" id="quantity-exit" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" max={availableStock > 0 ? availableStock : undefined} placeholder={`Máx: ${availableStock}`} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div>
                            <label htmlFor="reason-exit" className="block text-sm font-medium text-gray-700 mb-1">Motivo da Saída</label>
                            <select 
                                id="reason-exit" 
                                value={reason} 
                                onChange={e => setReason(e.target.value)} 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione o motivo</option>
                                {exitReasons.map(reasonOption => (
                                    <option key={reasonOption.value} value={reasonOption.value}>
                                        {reasonOption.label}
                                    </option>
                                ))}
                            </select>
                            
                            {reason === 'outro' && (
                                <div className="mt-2">
                                    <input 
                                        type="text" 
                                        placeholder="Especifique o motivo" 
                                        value={customReason} 
                                        onChange={e => setCustomReason(e.target.value)} 
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={!selectedProduct || !fromLocationId || !quantity || !reason || (reason === 'outro' && !customReason)} 
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-red-300"
                            >
                                <FaArrowCircleDown />
                                Confirmar Saída
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default StockExitForm;