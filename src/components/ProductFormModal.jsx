import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import Modal from './Modal';
import useFirestore from '../hooks/useFirestore';

export default function ProductFormModal({ isOpen, onClose, productToEdit }) {
    const { docs: categories } = useFirestore('categories');
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const isEditing = !!productToEdit;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: productToEdit.name || '',
                categoryId: productToEdit.categoryId || '',
                price: productToEdit.price || 0,
                description: productToEdit.description || '',
                minStock: productToEdit.minStock || 0,
            });
        } else {
            // Reset form for new product
            setFormData({
                name: '',
                categoryId: '',
                price: 0,
                description: '',
                minStock: 0,
            });
        }
    }, [productToEdit, isOpen]); // Reset form when modal opens or product changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const dataToSave = {
                    ...formData,
                    price: Number(formData.price),
                    minStock: Number(formData.minStock),
                };

                if (isEditing) {
                    const productRef = doc(db, 'products', productToEdit.id);
                    await updateDoc(productRef, dataToSave);
                } else {
                    await addDoc(collection(db, 'products'), {
                        ...dataToSave,
                        totalQuantity: 0, // New products start with 0 quantity
                        createdAt: new Date(),
                    });
                }
                resolve();
            } catch (err) {
                console.error('Error saving product:', err);
                reject(err);
            }
        });

        toast.promise(promise, {
            loading: 'Salvando produto...',
            success: 'Produto salvo com sucesso!',
            error: 'Falha ao salvar o produto.',
        }).then(() => {
            onClose();
        }).finally(() => {
            setLoading(false);
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                    <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select name="categoryId" id="categoryId" value={formData.categoryId || ''} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                        <option value="" disabled>Selecione uma categoria</option>
        {(Array.isArray(categories) && categories.length > 0) ? (
            categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)
        ) : (
            <option value="" disabled>Carregando categorias...</option>
        )}
                    </select>
                </div>

                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">PreÃ§o (R$)</label>
                    <input type="number" name="price" id="price" value={formData.price || ''} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="minStock" className="block text-sm font-medium text-gray-700">Estoque MÃ­nimo</label>
                    <input type="number" name="minStock" id="minStock" value={formData.minStock || ''} onChange={handleChange} required min="0" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">DescriÃ§Ã£o</label>
                    <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {loading ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
