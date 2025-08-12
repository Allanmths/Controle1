import React, { useMemo, useState } from 'react';
import { FaFilter, FaDownload, FaMapMarkerAlt, FaBoxes, FaDollarSign } from 'react-icons/fa';
import useFirestore from '../../hooks/useFirestore';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const StockValuationReport = () => {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { docs: categories, loading: loadingCategories } = useFirestore('categories');
    const { docs: locations, loading: loadingLocations } = useFirestore('locations');

    const loading = loadingProducts || loadingCategories || loadingLocations;

    // Estados para filtros
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showOnlyWithStock, setShowOnlyWithStock] = useState(false);
    const [reportType, setReportType] = useState('summary'); // 'summary' ou 'detailed'

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Sem Categoria';
    };

    const getLocationName = (locationId) => {
        const location = locations.find(l => l.id === locationId);
        return location ? location.name : 'Local Desconhecido';
    };

    const reportData = useMemo(() => {
        if (!products || !products.length) return { lines: [], grandTotal: 0, totalQuantity: 0 };

        let filteredProducts = [...products];

        // Aplicar filtros
        if (selectedCategory) {
            filteredProducts = filteredProducts.filter(p => p.categoryId === selectedCategory);
        }

        if (selectedLocation) {
            filteredProducts = filteredProducts.filter(p => 
                p.locations && p.locations[selectedLocation] && p.locations[selectedLocation] > 0
            );
        }

        if (showOnlyWithStock) {
            filteredProducts = filteredProducts.filter(p => {
                const totalQty = Object.values(p.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                return totalQty > 0;
            });
        }

        let lines = [];
        let grandTotal = 0;
        let totalQuantity = 0;

        if (reportType === 'summary') {
            // Relatório resumido por produto
            lines = filteredProducts.map(product => {
                const locations = product.locations || {};
                let productTotalStock = 0;
                
                if (selectedLocation) {
                    productTotalStock = Number(locations[selectedLocation] || 0);
                } else {
                    productTotalStock = Object.values(locations).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                }

                const cost = product.cost || 0;
                const totalValue = productTotalStock * cost;
                grandTotal += totalValue;
                totalQuantity += productTotalStock;

                return {
                    id: product.id,
                    name: product.name,
                    category: getCategoryName(product.categoryId),
                    totalStock: productTotalStock,
                    cost,
                    totalValue,
                    locations: selectedLocation ? 
                        { [selectedLocation]: productTotalStock } : 
                        locations
                };
            });
        } else {
            // Relatório detalhado por produto-localização
            filteredProducts.forEach(product => {
                const locations = product.locations || {};
                const locationsToShow = selectedLocation ? 
                    { [selectedLocation]: locations[selectedLocation] || 0 } : 
                    locations;

                Object.entries(locationsToShow).forEach(([locationId, qty]) => {
                    const quantity = Number(qty) || 0;
                    if (quantity > 0 || !showOnlyWithStock) {
                        const cost = product.cost || 0;
                        const totalValue = quantity * cost;
                        grandTotal += totalValue;
                        totalQuantity += quantity;

                        lines.push({
                            id: `${product.id}-${locationId}`,
                            productId: product.id,
                            name: product.name,
                            category: getCategoryName(product.categoryId),
                            location: getLocationName(locationId),
                            locationId: locationId,
                            totalStock: quantity,
                            cost,
                            totalValue
                        });
                    }
                });
            });
        }

        return { lines, grandTotal, totalQuantity };
    }, [products, categories, locations, selectedLocation, selectedCategory, showOnlyWithStock, reportType]);

    const clearFilters = () => {
        setSelectedLocation('');
        setSelectedCategory('');
        setShowOnlyWithStock(false);
    };

    const exportToCSV = () => {
        const { lines } = reportData;
        const headers = reportType === 'summary' ? 
            ['Produto', 'Categoria', 'Estoque Total', 'Custo Unitário', 'Valor Total'] :
            ['Produto', 'Categoria', 'Localização', 'Estoque', 'Custo Unitário', 'Valor Total'];
        
        const csvContent = [
            headers.join(','),
            ...lines.map(item => reportType === 'summary' ?
                [item.name, item.category, item.totalStock, item.cost.toFixed(2), item.totalValue.toFixed(2)].join(',') :
                [item.name, item.category, item.location, item.totalStock, item.cost.toFixed(2), item.totalValue.toFixed(2)].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_valorizacao_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Header e Filtros */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Relatório de Valorização de Estoque</h3>
                        <p className="text-gray-600 mt-1">
                            Valor monetário do estoque baseado no custo de cada produto
                            {selectedLocation ? ` | Localização: ${getLocationName(selectedLocation)}` : ''}
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="summary">Resumido por Produto</option>
                            <option value="detailed">Detalhado por Localização</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas as localizações</option>
                            {(locations || []).map(location => (
                                <option key={location.id} value={location.id}>{location.name}</option>
                            ))}
                        </select>
                    </div>

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaBoxes className="text-blue-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-blue-600">Total de Itens</p>
                                <p className="text-2xl font-bold text-blue-800">{reportData.lines.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaMapMarkerAlt className="text-green-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-green-600">Estoque Total</p>
                                <p className="text-2xl font-bold text-green-800">{reportData.totalQuantity.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaDollarSign className="text-purple-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-purple-600">Valor Total do Estoque</p>
                                <p className="text-2xl font-bold text-purple-800">{formatCurrency(reportData.grandTotal)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                            {reportType === 'detailed' && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                            )}
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unitário</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={reportType === 'detailed' ? 6 : 5} className="text-center py-10">Carregando dados...</td></tr>
                        ) : reportData && reportData.lines && reportData.lines.length > 0 ? (
                            reportData.lines.map(line => (
                                <tr key={line.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{line.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{line.category}</td>
                                    {reportType === 'detailed' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{line.location}</td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center font-medium">{line.totalStock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatCurrency(line.cost)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 text-right">{formatCurrency(line.totalValue)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={reportType === 'detailed' ? 6 : 5} className="text-center py-10">
                                {loading ? 'Carregando...' : 'Nenhum produto encontrado com os filtros aplicados. Adicione produtos com custo para ver este relatório.'}
                            </td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-100">
                        <tr>
                            <td colSpan={reportType === 'detailed' ? 5 : 4} className="px-6 py-4 text-right text-sm font-bold text-gray-800 uppercase">
                                Total ({reportData.lines.length} itens | {reportData.totalQuantity} unidades):
                            </td>
                            <td className="px-6 py-4 text-right text-lg font-extrabold text-blue-600">{formatCurrency(reportData.grandTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default StockValuationReport;
