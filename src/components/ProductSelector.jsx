import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FaSearch, FaTimes, FaChevronDown, FaBox } from 'react-icons/fa';
import useFirestore from '../hooks/useFirestore';

const ProductSelector = ({ onProductSelect, selectedProductId, placeholder = "Selecione um produto" }) => {
    const { docs: products, loading } = useFirestore('products', { field: 'name', direction: 'asc' });
    const { docs: categories } = useFirestore('categories');
    
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Encontrar produto selecionado
    useEffect(() => {
        if (selectedProductId && products) {
            const product = products.find(p => p.id === selectedProductId);
            setSelectedProduct(product || null);
        } else {
            setSelectedProduct(null);
        }
    }, [selectedProductId, products]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focar no input de busca quando abrir
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Filtrar produtos
    const filteredProducts = useMemo(() => {
        if (!products) return [];

        return products.filter(product => {
            // Filtro por nome
            const matchesName = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filtro por código (se existir)
            const matchesCode = product.code ? 
                product.code.toLowerCase().includes(searchTerm.toLowerCase()) : false;
            
            // Filtro por categoria
            const matchesCategory = selectedCategory === '' || product.categoryId === selectedCategory;
            
            return (matchesName || matchesCode) && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        onProductSelect(product);
        setIsOpen(false);
        setSearchTerm('');
    };

    const clearSelection = () => {
        setSelectedProduct(null);
        onProductSelect(null);
        setSearchTerm('');
    };

    const openDropdown = () => {
        setIsOpen(true);
        setSearchTerm('');
    };

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Produto
                </label>
                <div className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
                    <span className="text-gray-500 dark:text-gray-400">Carregando produtos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Produto
            </label>
            
            {/* Input Principal */}
            <div className="relative">
                <div
                    onClick={openDropdown}
                    className={`w-full p-3 border rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-between ${
                        isOpen 
                            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    } bg-white dark:bg-gray-700`}
                >
                    <div className="flex items-center gap-2 flex-1">
                        <FaBox className="text-gray-400 dark:text-gray-500" />
                        <span className={`${selectedProduct ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {selectedProduct ? selectedProduct.name : placeholder}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {selectedProduct && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearSelection();
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <FaChevronDown 
                            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                        />
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
                        {/* Header com filtros */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-600 space-y-3">
                            {/* Busca por nome/código */}
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar por nome ou código..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Filtro por categoria */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Todas as categorias</option>
                                {categories && categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lista de produtos */}
                        <div className="max-h-64 overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    <FaBox className="mx-auto mb-2 text-2xl" />
                                    <p>Nenhum produto encontrado</p>
                                    <p className="text-sm">Tente ajustar os filtros</p>
                                </div>
                            ) : (
                                filteredProducts.map(product => {
                                    const category = categories?.find(cat => cat.id === product.categoryId);
                                    const totalStock = Object.values(product.locations || {})
                                        .reduce((sum, quantity) => sum + quantity, 0);
                                    
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductSelect(product)}
                                            className={`p-3 cursor-pointer transition-colors duration-150 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                                                selectedProduct?.id === product.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        {product.name}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        {product.code && (
                                                            <span>Código: {product.code}</span>
                                                        )}
                                                        {category && (
                                                            <span>Categoria: {category.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-medium ${
                                                        totalStock <= (product.minStock || 5)
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                        {totalStock} unid.
                                                    </div>
                                                    {product.price && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            R$ {product.price.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer com informaÃ§Ãµes */}
                        {filteredProducts.length > 0 && (
                            <div className="p-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {filteredProducts.length} produto(s) encontrado(s)
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* InformaÃ§Ãµes do produto selecionado */}
            {selectedProduct && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                {selectedProduct.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-blue-700 dark:text-blue-300">
                                {selectedProduct.code && (
                                    <span>Código: {selectedProduct.code}</span>
                                )}
                                <span>
                                    Estoque: {Object.values(selectedProduct.locations || {})
                                        .reduce((sum, quantity) => sum + quantity, 0)} unid.
                                </span>
                            </div>
                        </div>
                        {selectedProduct.price && (
                            <div className="text-right">
                                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    R$ {selectedProduct.price.toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductSelector;
