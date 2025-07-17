import React, { useMemo } from 'react';
import useFirestore from '../../hooks/useFirestore';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const StockValuationReport = () => {
    const { docs: products, loading } = useFirestore('products');

    const reportData = useMemo(() => {
        if (!products.length) return { lines: [], grandTotal: 0 };

        const lines = products.map(product => {
            const totalStock = Object.values(product.locations || {}).reduce((sum, qty) => sum + qty, 0);
            const cost = product.cost || 0;
            const totalValue = totalStock * cost;
            return {
                id: product.id,
                name: product.name,
                totalStock,
                cost,
                totalValue
            };
        });

        const grandTotal = lines.reduce((sum, line) => sum + line.totalValue, 0);

        return { lines, grandTotal };
    }, [products]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Relatório de Valorização de Estoque</h3>
            <p className="text-gray-600 mb-6">Este relatório calcula o valor monetário total do seu estoque com base no custo de cada produto.</p>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unitário</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-10">Carregando dados...</td></tr>
                        ) : reportData && reportData.lines && reportData.lines.length > 0 ? (
                            reportData.lines.map(line => (
                                <tr key={line.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{line.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{line.totalStock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatCurrency(line.cost)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 text-right">{formatCurrency(line.totalValue)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="text-center py-10">Nenhum produto encontrado. Adicione produtos com custo para ver este relatório.</td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-100">
                        <tr>
                            <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold text-gray-800 uppercase">Valor Total do Estoque</td>
                            <td className="px-6 py-4 text-right text-lg font-extrabold text-blue-600">{formatCurrency(reportData.grandTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default StockValuationReport;
