import React, { useMemo, useState } from 'react';
import { FaMapMarkerAlt, FaBoxes, FaDownload, FaFilter, FaDollarSign } from 'react-icons/fa';
import useFirestore from '../../hooks/useFirestore';

const LocationStockReport = () => {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { docs: categories, loading: loadingCategories } = useFirestore('categories');
    const { docs: locations, loading: loadingLocations } = useFirestore('locations');

    const loading = loadingProducts || loadingCategories || loadingLocations;

    // Estados para filtros
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showOnlyWithStock, setShowOnlyWithStock] = useState(true);

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Sem Categoria';
    };

    const getLocationName = (locationId) => {
        const location = locations.find(l => l.id === locationId);
        return location ? location.name : 'Local Desconhecido';
    };

    const reportData = useMemo(() => {
        if (!products || !products.length || !locations || !locations.length) {
            return { locationSummary: [], grandTotals: { totalProducts: 0, totalQuantity: 0, totalValue: 0 } };
        }

        let filteredProducts = [...products];

        // Aplicar filtros
        if (selectedCategory) {
            filteredProducts = filteredProducts.filter(p => p.categoryId === selectedCategory);
        }

        // Criar resumo por localização
        const locationSummary = locations.map(location => {
            const locationProducts = [];
            let locationTotalQuantity = 0;
            let locationTotalValue = 0;

            filteredProducts.forEach(product => {
                const quantity = Number(product.locations?.[location.id] || 0);
                
                if (quantity > 0 || !showOnlyWithStock) {
                    const value = (product.price || 0) * quantity;
                    locationTotalQuantity += quantity;
                    locationTotalValue += value;

                    locationProducts.push({
                        id: product.id,
                        name: product.name,
                        category: getCategoryName(product.categoryId),
                        quantity: quantity,
                        price: product.price || 0,
                        value: value,
                        minStock: product.minStock || 0,
                        isLowStock: quantity <= (product.minStock || 0) && quantity > 0
                    });
                }
            });

            return {
                locationId: location.id,
                locationName: location.name,
                products: showOnlyWithStock ? locationProducts.filter(p => p.quantity > 0) : locationProducts,
                totalProducts: showOnlyWithStock ? locationProducts.filter(p => p.quantity > 0).length : locationProducts.length,
                totalQuantity: locationTotalQuantity,
                totalValue: locationTotalValue,
                lowStockCount: locationProducts.filter(p => p.isLowStock).length
            };
        }).filter(loc => !showOnlyWithStock || loc.totalQuantity > 0);

        const grandTotals = {
            totalProducts: locationSummary.reduce((sum, loc) => sum + loc.totalProducts, 0),
            totalQuantity: locationSummary.reduce((sum, loc) => sum + loc.totalQuantity, 0),
            totalValue: locationSummary.reduce((sum, loc) => sum + loc.totalValue, 0)
        };

        return { locationSummary, grandTotals };
    }, [products, categories, locations, selectedCategory, showOnlyWithStock]);

    const clearFilters = () => {
        setSelectedCategory('');
        setShowOnlyWithStock(true);
    };

    const exportToCSV = () => {
        const headers = ['Localização', 'Produto', 'Categoria', 'Quantidade', 'Preço Unitário', 'Valor Total', 'Status'];
        const csvRows = [];

        reportData.locationSummary.forEach(location => {
            location.products.forEach(product => {
                csvRows.push([
                    location.locationName,
                    product.name,
                    product.category,
                    product.quantity,
                    product.price.toFixed(2),
                    product.value.toFixed(2),
                    product.isLowStock ? 'Estoque Baixo' : 'Normal'
                ].join(','));
            });
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_estoque_por_localizacao_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Header e Filtros */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Relatório de Estoque por Localização</h3>
                        <p className="text-gray-600 mt-1">
                            Posição detalhada do estoque em cada localização
                            {selectedCategory ? ` | Categoria: ${getCategoryName(selectedCategory)}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button 
                            onClick={exportToCSV}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                        >
                            <FaDownload className="mr-2" />
                            CSV
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas as categorias</option>
                            {(categories || []).map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={showOnlyWithStock}
                                onChange={(e) => setShowOnlyWithStock(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Apenas com estoque</span>
                        </label>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center justify-center"
                        >
                            <FaFilter className="mr-2" />
                            Limpar
                        </button>
                    </div>
                </div>

                {/* Estatísticas Resumidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaMapMarkerAlt className="text-blue-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-blue-600">Localizações</p>
                                <p className="text-2xl font-bold text-blue-800">{reportData.locationSummary.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaBoxes className="text-green-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-green-600">Total de Produtos</p>
                                <p className="text-2xl font-bold text-green-800">{reportData.grandTotals.totalProducts}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaBoxes className="text-yellow-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-yellow-600">Quantidade Total</p>
                                <p className="text-2xl font-bold text-yellow-800">{reportData.grandTotals.totalQuantity.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaDollarSign className="text-purple-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-purple-600">Valor Total</p>
                                <p className="text-2xl font-bold text-purple-800">
                                    R$ {reportData.grandTotals.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-500 py-4">Carregando dados do relatório...</p>
            ) : (
                <div className="space-y-6">
                    {reportData.locationSummary.map((location) => (
                        <div key={location.locationId} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Cabeçalho da Localização */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex flex-col md:flex-row md:items-center justify-between">
                                    <div className="flex items-center">
                                        <FaMapMarkerAlt className="text-blue-500 mr-3" />
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800">{location.locationName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {location.totalProducts} produtos | {location.totalQuantity} unidades
                                                {location.lowStockCount > 0 && (
                                                    <span className="ml-2 text-red-600 font-medium">
                                                        | {location.lowStockCount} com estoque baixo
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 md:mt-0">
                                        <span className="text-lg font-bold text-gray-800">
                                            R$ {location.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela de Produtos */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Unit.</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {location.products.length > 0 ? (
                                            location.products.map((product) => (
                                                <tr key={product.id} className={product.isLowStock ? 'bg-red-50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {product.name}
                                                        {product.isLowStock && (
                                                            <span className="ml-2 text-xs text-red-600 font-semibold">⚠️ Baixo</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                        <span className={`font-bold ${product.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {product.quantity}
                                                        </span>
                                                        {product.minStock > 0 && (
                                                            <div className="text-xs text-gray-400">Mín: {product.minStock}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                        R$ {product.price.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                        R$ {product.value.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                    Nenhum produto encontrado nesta localização
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    
                    {reportData.locationSummary.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <FaMapMarkerAlt className="mx-auto text-4xl mb-4 text-gray-300" />
                            <p>Nenhuma localização encontrada com os filtros aplicados.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationStockReport;
