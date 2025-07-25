import React, { useMemo } from 'react';
import useFirestore from '../hooks/useFirestore';

export default function StockReport() {
    const { docs: products, loading: loadingProducts } = useFirestore('products', { field: 'name', direction: 'asc' });
    const { docs: categories, loading: loadingCategories } = useFirestore('categories');

    const loading = loadingProducts || loadingCategories;

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Sem Categoria';
    };

    const totalStockValue = useMemo(() => {
        return (products || []).reduce((acc, product) => {
            const value = (product.price || 0) * (product.totalQuantity || 0);
            return acc + value;
        }, 0);
    }, [products]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4 print:hidden">
                <h3 className="text-xl font-semibold text-gray-800">RelatÃ³rio de PosiÃ§Ã£o de Estoque</h3>
                <button onClick={handlePrint} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <i className="fas fa-print mr-2"></i>
                    Imprimir
                </button>
            </div>

            <div className="print:block">
                <h2 className="text-2xl font-bold text-center mb-2 hidden print:block">RelatÃ³rio de Estoque</h2>
                <p className="text-center text-sm text-gray-500 mb-6 hidden print:block">Gerado em: {new Date().toLocaleString('pt-BR')}</p>

                {loading ? (
                    <p className="text-center text-gray-500 py-4">Carregando dados do relatÃ³rio...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. em Estoque</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PreÃ§o Unit.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(products || []).map(product => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryName(product.categoryId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{product.totalQuantity || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`R$ ${product.price?.toFixed(2) || '0.00'}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`R$ ${((product.price || 0) * (product.totalQuantity || 0)).toFixed(2)}`}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-bold text-gray-700 uppercase">Valor Total em Estoque:</td>
                                    <td className="px-6 py-3 text-left text-sm font-bold text-gray-900">{`R$ ${totalStockValue.toFixed(2)}`}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
