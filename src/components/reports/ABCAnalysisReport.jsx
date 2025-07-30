import React, { useMemo, useState } from 'react';
import useFirestore from '../../hooks/useFirestore';
import { subDays, isAfter } from 'date-fns';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const getClassStyle = (classification) => {
    switch (classification) {
        case 'A': return { label: 'Classe A', color: 'bg-red-500 text-white', description: 'Produtos de altíssimo impacto. Requerem atenção máxima.' };
        case 'B': return { label: 'Classe B', color: 'bg-yellow-400 text-gray-800', description: 'Produtos de impacto intermediÃ¡rio. Bom controle Ã© necessÃ¡rio.' };
        case 'C': return { label: 'Classe C', color: 'bg-green-500 text-white', description: 'Produtos de baixo impacto. GestÃ£o mais simples.' };
        default: return { label: '', color: 'bg-gray-200', description: '' };
    }
};

const ABCAnalysisReport = () => {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { docs: movements, loading: loadingMovements } = useFirestore('kardex');
    const [periodDays, setPeriodDays] = useState(90);

    const reportData = useMemo(() => {
        if (!products.length || !movements.length) {
            return { lines: [], totalConsumptionValue: 0 };
        }

        const periodStartDate = subDays(new Date(), periodDays);
        
        const consumptionData = (products || []).map(product => {
            const productMovements = movements.filter(m => 
                m.productId === product.id &&
                (m.type === 'saida' || m.type === 'transfer_out') &&
                m.timestamp && isAfter(m.timestamp.toDate(), periodStartDate)
            );

            const totalQuantityConsumed = productMovements.reduce((sum, m) => sum + m.quantity, 0);
            const cost = product.cost || 0;
            const consumptionValue = totalQuantityConsumed * cost;

            return { id: product.id, name: product.name, consumptionValue };
        });

        const totalConsumptionValue = consumptionData.reduce((sum, p) => sum + p.consumptionValue, 0);

        if (totalConsumptionValue === 0) {
            return { lines: [], totalConsumptionValue: 0 };
        }

        const sortedProducts = consumptionData
            .filter(p => p.consumptionValue > 0)
            .sort((a, b) => b.consumptionValue - a.consumptionValue);
        
        let cumulativeValue = 0;
        const classifiedProducts = sortedProducts.map(p => {
            cumulativeValue += p.consumptionValue;
            const cumulativePercentage = (cumulativeValue / totalConsumptionValue) * 100;
            let classification = 'C';
            if (cumulativePercentage <= 80) {
                classification = 'A';
            } else if (cumulativePercentage <= 95) {
                classification = 'B';
            }
            return { ...p, cumulativePercentage, classification };
        });

        return { lines: classifiedProducts, totalConsumptionValue };

    }, [products, movements, periodDays]);

    const loading = loadingProducts || loadingMovements;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">AnÃ¡lise de Curva ABC</h3>
                    <p className="text-gray-600 mt-1">Classifica os produtos por relevÃ¢ncia de consumo para otimizar a gestÃ£o de estoque.</p>
                </div>
                <div>
                    <label htmlFor="period" className="block text-sm font-medium text-gray-700">PerÃ­odo de AnÃ¡lise</label>
                    <select id="period" value={periodDays} onChange={e => setPeriodDays(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option value="30">Ãšltimos 30 dias</option>
                        <option value="60">Ãšltimos 60 dias</option>
                        <option value="90">Ãšltimos 90 dias</option>
                        <option value="180">Ãšltimos 6 meses</option>
                        <option value="365">Ãšltimo ano</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor de Consumo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Acumulada</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-10">Analisando dados...</td></tr>
                        ) : reportData && reportData.lines && reportData.lines.length > 0 ? (
                            reportData.lines.map(line => {
                                const { label, color } = getClassStyle(line.classification);
                                return (
                                    <tr key={line.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${color}`}>
                                                {line.classification}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{line.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{formatCurrency(line.consumptionValue)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 text-right">{line.cumulativePercentage.toFixed(2)}%</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan="4" className="text-center py-10">Nenhuma movimentaÃ§Ã£o de saÃ­da encontrada no perÃ­odo para anÃ¡lise.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ABCAnalysisReport;
