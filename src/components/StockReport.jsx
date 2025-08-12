import React, { useMemo, useState } from 'react';
import { FaFilter, FaDownload, FaMapMarkerAlt, FaBoxes, FaDollarSign } from 'react-icons/fa';
import useFirestore from '../hooks/useFirestore';

export default function StockReport() {
    const { docs: products, loading: loadingProducts } = useFirestore('products', { field: 'name', direction: 'asc' });
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

    // Processar dados completos (não paginados) com filtros aplicados
    const processedData = useMemo(() => {
        let filteredProducts = [...(products || [])];

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

        let reportData = [];
        let totalValue = 0;
        let totalQuantity = 0;

        if (reportType === 'summary') {
            // Relatório resumido por produto
            reportData = filteredProducts.map(product => {
                const locations = product.locations || {};
                let productTotalQty = 0;
                
                if (selectedLocation) {
                    productTotalQty = Number(locations[selectedLocation] || 0);
                } else {
                    productTotalQty = Object.values(locations).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                }

                const value = (product.price || 0) * productTotalQty;
                totalValue += value;
                totalQuantity += productTotalQty;

                return {
                    id: product.id,
                    name: product.name,
                    category: getCategoryName(product.categoryId),
                    quantity: productTotalQty,
                    price: product.price || 0,
                    value: value,
                    minStock: product.minStock || 0,
                    locations: selectedLocation ? 
                        { [selectedLocation]: productTotalQty } : 
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
                        const value = (product.price || 0) * quantity;
                        totalValue += value;
                        totalQuantity += quantity;

                        reportData.push({
                            id: `${product.id}-${locationId}`,
                            productId: product.id,
                            name: product.name,
                            category: getCategoryName(product.categoryId),
                            location: getLocationName(locationId),
                            locationId: locationId,
                            quantity: quantity,
                            price: product.price || 0,
                            value: value,
                            minStock: product.minStock || 0
                        });
                    }
                });
            });
        }

        return { reportData, totalValue, totalQuantity };
    }, [products, categories, locations, selectedLocation, selectedCategory, showOnlyWithStock, reportType]);

    const clearFilters = () => {
        setSelectedLocation('');
        setSelectedCategory('');
        setShowOnlyWithStock(false);
    };

    const exportToCSV = () => {
        const { reportData } = processedData;
        const headers = reportType === 'summary' ? 
            ['Produto', 'Categoria', 'Quantidade', 'Preço Unitário', 'Valor Total'] :
            ['Produto', 'Categoria', 'Localização', 'Quantidade', 'Preço Unitário', 'Valor Total'];
        
        const csvContent = [
            headers.join(','),
            ...reportData.map(item => reportType === 'summary' ?
                [item.name, item.category, item.quantity, item.price.toFixed(2), item.value.toFixed(2)].join(',') :
                [item.name, item.category, item.location, item.quantity, item.price.toFixed(2), item.value.toFixed(2)].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_estoque_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            {/* Header e Filtros */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">Relatório de Posição de Estoque</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedLocation ? `Localização: ${getLocationName(selectedLocation)}` : 'Todas as localizações'}
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
                        <button 
                            onClick={handlePrint} 
                            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg flex items-center print:hidden"
                        >
                            <i className="fas fa-print mr-2"></i>
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg print:hidden">
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
                                <p className="text-2xl font-bold text-blue-800">{processedData.reportData.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaMapMarkerAlt className="text-green-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-green-600">Quantidade Total</p>
                                <p className="text-2xl font-bold text-green-800">{processedData.totalQuantity.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FaDollarSign className="text-purple-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm text-purple-600">Valor Total</p>
                                <p className="text-2xl font-bold text-purple-800">R$ {processedData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cabeçalho para impressão */}
            <div className="print:block hidden">
                <h2 className="text-2xl font-bold text-center mb-2">Relatório de Estoque</h2>
                <p className="text-center text-sm text-gray-500 mb-6">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                {selectedLocation && <p className="text-center text-sm mb-2">Localização: {getLocationName(selectedLocation)}</p>}
                {selectedCategory && <p className="text-center text-sm mb-2">Categoria: {getCategoryName(selectedCategory)}</p>}
            </div>

            {loading ? (
                <p className="text-center text-gray-500 py-4">Carregando dados do relatório...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                {reportType === 'detailed' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                                )}
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. em Estoque</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Unit.</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                {reportType === 'summary' && (
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Mín.</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {processedData.reportData.map(item => (
                                <tr key={item.id} className={item.quantity <= item.minStock ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                    {reportType === 'detailed' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.location}</td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <span className={`font-bold ${item.quantity <= item.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                                            {item.quantity}
                                        </span>
                                        {reportType === 'summary' && item.quantity <= item.minStock && (
                                            <span className="ml-2 text-xs text-red-500">⚠️ Baixo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">R$ {item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">R$ {item.value.toFixed(2)}</td>
                                    {reportType === 'summary' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.minStock}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={reportType === 'detailed' ? 5 : 4} className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                                    Total ({processedData.reportData.length} itens | {processedData.totalQuantity} unidades):
                                </td>
                                <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                    R$ {processedData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                {reportType === 'summary' && <td></td>}
                            </tr>
                        </tfoot>
                    </table>
                    
                    {processedData.reportData.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <FaBoxes className="mx-auto text-4xl mb-4 text-gray-300" />
                            <p>Nenhum produto encontrado com os filtros aplicados.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
