import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, doc, runTransaction } from 'firebase/firestore';
import Modal from './Modal';
import ProductSelector from './ProductSelector';
import useFirestore from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';

const INITIAL_STATE = {
    selectedProduct: null,
    type: 'entrada',
    quantity: 1,
    motive: '',
};

export default function MovementFormModal({ isOpen, onClose }) {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(INITIAL_STATE);
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { selectedProduct, type, quantity, motive } = formData;
        const numQuantity = Number(quantity);

        if (!selectedProduct || numQuantity <= 0) {
            setError('Por favor, preencha todos os campos corretamente.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const productRef = doc(db, 'products', selectedProduct.id);
            const movementRef = doc(collection(db, 'movements'));

            await runTransaction(db, async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    throw new Error('Produto não encontrado!');
                }

                const currentQuantity = productDoc.data().totalQuantity || 0;
                let newQuantity;

                if (type === 'entrada') {
                    newQuantity = currentQuantity + numQuantity;
                } else { // saida
                    if (currentQuantity < numQuantity) {
                        throw new Error('Estoque insuficiente para realizar a saída.');
                    }
                    newQuantity = currentQuantity - numQuantity;
                }

                transaction.update(productRef, { totalQuantity: newQuantity });
                transaction.set(movementRef, {
                    productId: selectedProduct.id,
                    type,
                    quantity: numQuantity,
                    motive,
                    date: new Date(),
                    userEmail: currentUser?.email || 'N/A',
                });
            });

            onClose();
        } catch (err) {
            console.error('Transaction failed: ', err);
            setError(err.message || 'Falha ao registrar a movimentação.');
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nova Movimentação">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg">{error}</p>}
                
                <ProductSelector 
                    onProductSelect={(product) => setFormData(prev => ({ ...prev, selectedProduct: product }))}
                    selectedProductId={formData.selectedProduct?.id}
                    placeholder="Buscar produto para movimentação..."
                />

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Movimentação</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input type="number" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} required min="1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="motive" className="block text-sm font-medium text-gray-700">Motivo (Opcional)</label>
                    <input type="text" name="motive" id="motive" value={formData.motive} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Ex: Compra de fornecedor" />
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
