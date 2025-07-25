import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';
import useFirestore from '../hooks/useFirestore';
import { ensureArray } from '../utils/arrayHelpers';
import { useUserActionNotifications } from '../hooks/useNotificationHelpers';

const ProductModal = ({ isOpen, onClose, productToEdit, locations, userData }) => {
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [unit, setUnit] = useState('un');
        const [minStock, setMinStock] = useState('');
    const [cost, setCost] = useState('');
    const [stockQuantities, setStockQuantities] = useState({});

    const { docs: categories } = useFirestore('categories');
    const { notifyProductAdded, notifyProductUpdated } = useUserActionNotifications();

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setName(productToEdit.name || '');
                setCategoryId(productToEdit.categoryId || '');
                setUnit(productToEdit.unit || 'un');
                                setMinStock(productToEdit.minStock || '');
                setCost(productToEdit.cost || '');
                setStockQuantities(productToEdit.locations || {});
            } else {
                // Reset for new product
                setName('');
                setCategoryId('');
                setUnit('un');
                                setMinStock('');
                setCost('');
                setStockQuantities({});
            }
        } 
    }, [productToEdit, isOpen]);

    const handleQuantityChange = (locationId, value) => {
        // Allow empty string to clear input, but store as 0 if needed
        const numericValue = value === '' ? '' : Number(value);
        if (numericValue < 0) return; // Prevent negative stock
        setStockQuantities(prev => ({ ...prev, [locationId]: numericValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !categoryId || !unit) {
            toast.error('Por favor, preencha todos os campos obrigatÃ³rios.');
            return;
        }

        // Create a clean version of stockQuantities with numbers
        const finalStockQuantities = Object.entries(stockQuantities).reduce((acc, [key, value]) => {
            acc[key] = Number(value) || 0;
            return acc;
        }, {});

        const productData = {
            name,
            categoryId,
            unit,
                        minStock: Number(minStock) || 0,
            cost: Number(cost) || 0,
            locations: finalStockQuantities,
            updatedAt: serverTimestamp(),
        };

        const promise = async () => {
            let productId = productToEdit?.id;

            if (productToEdit) {
                const productRef = doc(db, 'products', productId);
                await updateDoc(productRef, productData);
            } else {
                const docRef = await addDoc(collection(db, 'products'), {
                    ...productData,
                    createdAt: serverTimestamp(),
                });
                productId = docRef.id;
            }

            // --- Kardex Movement Logging ---
            const batch = writeBatch(db);
            const movementsRef = collection(db, 'movements');
            const oldQuantities = productToEdit?.locations || {};
            const locationMap = ensureArray(locations, 'locations').reduce((acc, loc) => {
                acc[loc.id] = loc.name;
                return acc;
            }, {});

            const allLocationIds = new Set([...Object.keys(oldQuantities), ...Object.keys(finalStockQuantities)]);

            allLocationIds.forEach(locationId => {
                const oldQty = Number(oldQuantities[locationId] || 0);
                const newQty = Number(finalStockQuantities[locationId] || 0);

                if (oldQty !== newQty) {
                    const movementDoc = doc(movementsRef);
                    batch.set(movementDoc, {
                        productId,
                        productName: name,
                        locationId,
                        locationName: locationMap[locationId] || 'N/A',
                        quantityBefore: oldQty,
                        quantityAfter: newQty,
                        quantityChanged: newQty - oldQty,
                        type: productToEdit ? 'Ajuste Manual' : 'Entrada Inicial',
                        userId: userData?.uid || 'unknown',
                        userName: userData?.displayName || userData?.email || 'unknown',
                        timestamp: serverTimestamp(),
                    });
                }
            });
            
            await batch.commit();
        };

        toast.promise(promise(), {
            loading: 'Salvando produto...',
            success: (result) => {
                // Adicionar notificaÃ§Ã£o baseada na aÃ§Ã£o
                if (productToEdit) {
                    notifyProductUpdated(name);
                } else {
                    notifyProductAdded(name);
                }
                return `Produto "${name}" salvo com sucesso!`;
            },
            error: (err) => `Falha ao salvar: ${err.message}`,
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{productToEdit ? 'Editar Produto' : 'Adicionar Produto'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                            <input
                                type="text"
                                id="productName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="" disabled>Selecione...</option>
                                {ensureArray(categories, 'categories').length > 0 ? (
                                    ensureArray(categories, 'categories').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))
                                ) : (
                                    <option value="" disabled>Carregando categorias...</option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                            <select
                                id="unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="un">Unidade (un)</option>
                                <option value="kg">Quilograma (kg)</option>
                                <option value="g">Grama (g)</option>
                                <option value="m">Metro (m)</option>
                                <option value="l">Litro (l)</option>
                                <option value="caixa">Caixa (cx)</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-1">Estoque MÃ­nimo (Total)</label>
                            <input
                                type="number"
                                id="minStock"
                                value={minStock}
                                onChange={(e) => setMinStock(e.target.value)}
                                placeholder="Ex: 10"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">Custo por Unidade (R$)</label>
                            <input
                                type="number"
                                id="cost"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="Ex: 25.50"
                                step="0.01"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Estoque por Localidade</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {ensureArray(locations, 'locations').length > 0 ? (
                                ensureArray(locations, 'locations').map(location => (
                                    <div key={location.id}>
                                        <label htmlFor={`loc-${location.id}`} className="block text-sm font-medium text-gray-700 mb-1">{location.name}</label>
                                        <input
                                            type="number"
                                            id={`loc-${location.id}`}
                                        value={stockQuantities[location.id] || ''}
                                        onChange={(e) => handleQuantityChange(location.id, e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            ))
                            ) : (
                                <div className="col-span-full text-center text-gray-500">
                                    Carregando localidades...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition duration-300">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300">
                            {productToEdit ? 'Salvar AlteraÃ§Ãµes' : 'Adicionar Produto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
