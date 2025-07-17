import React, { useMemo, useState } from 'react';
import useFirestore from '../../hooks/useFirestore';
import { subDays, isBefore, format } from 'date-fns';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const DeadStockReport = () => {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { docs: movements, loading: loadingMovements } = useFirestore('kardex');
    const [periodDays, setPeriodDays] = useState(180);

    const reportData = useMemo(() => {
        if (!products || !products.length) return { lines: [], totalDeadValue: 0 };

        const thresholdDate = subDays(new Date(), periodDays);
        
        const deadStockLines = products.map(product => {
            const totalStock = Object.values(product.locations || {}).reduce((sum, qty) => sum + qty, 0);
            if (totalStock <= 0) return null;

            const lastOutMovement = movements
                .filter(m => m.productId === product.id && (m.type === 'saida' || m.type === 'transfer_out'))
                .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())[0];

            const lastMovementDate = lastOutMovement ? lastOutMovement.timestamp.toDate() : null;

            // Consider dead stock if no movement ever, or last movement is before threshold
            if (!lastMovementDate || isBefore(lastMovementDate, thresholdDate)) {
                const cost = product.cost || 0;
                const deadValue = totalStock * cost;
                return {
                    id: product.id,
                    name: product.name,
                    totalStock,
                    cost,
                    deadValue,
                    lastMovementDate: lastMovementDate ? format(lastMovementDate, 'dd/MM/yyyy') : 'Nunca teve saída'
                };
            }
            return null;
        }).filter(Boolean); // Remove nulls

        const totalDeadValue = deadStockLines.reduce((sum, line) => sum + line.deadValue, 0);

        return { lines: deadStockLines, totalDeadValue };

    }, [products, movements, periodDays]);

    const loading = loadingProducts || loadingMovements;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Relatório de Estoque Obsoleto</h3>
                    <p className="text-gray-600 mt-1">Identifica produtos sem movimentação de saída no período selecionado.</p>
                </div>
                <div>
                    <label htmlFor="period" className="block text-sm font-medium text-gray-700">Sem Saída nos Últimos</label>
                    <select id="period" value={periodDays} onChange={e => setPeriodDays(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option value="90">90 dias</option>
                        <option value="180">180 dias (6 meses)</option>
                        <option value="365">365 dias (1 ano)</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Parado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Parado</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Última Saída</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-10">Analisando dados...</td></tr>
                        ) : reportData && reportData.lines && reportData.lines.length > 0 ? (
                            reportData.lines.map(line => (
                                <tr key={line.id} className="hover:bg-gray-50 bg-orange-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{line.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center font-bold">{line.totalStock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 text-right">{formatCurrency(line.deadValue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{line.lastMovementDate}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="text-center py-10">Nenhum produto obsoleto encontrado para o período selecionado.</td></tr>
                        )}
                    </tbody>
                     <tfoot className="bg-gray-100">
                        <tr>
                            <td colSpan="2" className="px-6 py-4 text-right text-sm font-bold text-gray-800 uppercase">Valor Total Obsoleto</td>
                            <td colSpan="2" className="px-6 py-4 text-right text-lg font-extrabold text-red-700">{formatCurrency(reportData.totalDeadValue)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default DeadStockReport;
