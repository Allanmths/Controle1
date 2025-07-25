import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaBox, FaTags, FaMapMarkerAlt } from 'react-icons/fa';
import useFirestore from '../hooks/useFirestore';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const { docs: products } = useFirestore('products');
    const { docs: categories } = useFirestore('categories');
    const { docs: locations } = useFirestore('locations');

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === 'k') {
                event.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchResults = [];
        const lowerQuery = query.toLowerCase();

        // Buscar produtos
        products?.forEach(product => {
            if (product.name.toLowerCase().includes(lowerQuery)) {
                searchResults.push({
                    type: 'product',
                    title: product.name,
                    subtitle: `Produto â€¢ Estoque: ${product.totalQuantity || 0}`,
                    icon: FaBox,
                    action: () => navigate('/stock'),
                    data: product
                });
            }
        });

        // Buscar categorias
        categories?.forEach(category => {
            if (category.name.toLowerCase().includes(lowerQuery)) {
                searchResults.push({
                    type: 'category',
                    title: category.name,
                    subtitle: 'Categoria',
                    icon: FaTags,
                    action: () => navigate('/registers'),
                    data: category
                });
            }
        });

        // Buscar locais
        locations?.forEach(location => {
            if (location.name.toLowerCase().includes(lowerQuery)) {
                searchResults.push({
                    type: 'location',
                    title: location.name,
                    subtitle: 'Local',
                    icon: FaMapMarkerAlt,
                    action: () => navigate('/registers'),
                    data: location
                });
            }
        });

        setResults(searchResults.slice(0, 8)); // Limitar a 8 resultados
        setSelectedIndex(-1);
    }, [query, products, categories, locations, navigate]);

    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                event.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    results[selectedIndex].action();
                    handleClose();
                }
                break;
            case 'Escape':
                handleClose();
                break;
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
        setSelectedIndex(-1);
    };

    const handleResultClick = (result) => {
        result.action();
        handleClose();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
                <FaSearch className="w-4 h-4" />
                <span className="hidden md:inline text-sm">Buscar... (Ctrl+K)</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                <div className="flex items-center p-4 border-b">
                    <FaSearch className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar produtos, categorias, locais..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 outline-none text-lg"
                    />
                    <button
                        onClick={handleClose}
                        className="ml-3 text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes />
                    </button>
                </div>

                {results.length > 0 && (
                    <div className="max-h-96 overflow-y-auto">
                        {results.map((result, index) => {
                            const Icon = result.icon;
                            return (
                                <button
                                    key={`${result.type}-${index}`}
                                    onClick={() => handleResultClick(result)}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                                        index === selectedIndex ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <Icon className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <div className="font-medium text-gray-900">{result.title}</div>
                                        <div className="text-sm text-gray-500">{result.subtitle}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {query && results.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        <FaSearch className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum resultado encontrado para "{query}"</p>
                    </div>
                )}

                <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
                    <span>Use â†‘â†“ para navegar, Enter para selecionar</span>
                    <span>Esc para fechar</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
