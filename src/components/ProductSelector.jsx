import React, { useState } from 'react';
import useFirestore from '../hooks/useFirestore';

const ProductSelector = ({ onProductSelect, selectedProductId }) => {
    const { docs: products, loading } = useFirestore('products', { field: 'name', direction: 'asc' });

    const handleSelect = (e) => {
        const productId = e.target.value;
        const selectedProduct = products.find(p => p.id === productId);
        onProductSelect(selectedProduct || null);
    };

    return (
        <div>
            <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">
                Produto
            </label>
            <select
                id="product-select"
                value={selectedProductId || ''}
                onChange={handleSelect}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                disabled={loading}
            >
                <option value="">{loading ? 'Carregando produtos...' : 'Selecione um produto'}</option>
                {products && products.map(product => (
                    <option key={product.id} value={product.id}>
                        {product.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProductSelector;
