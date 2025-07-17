import React from 'react';
import useFirestore from '../hooks/useFirestore';

const StatCard = ({ title, value, icon, color, loading }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${color}`}>
            <i className={`fas ${icon} text-white text-xl`}></i>
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            )}
        </div>
    </div>
);

const ActivityItem = ({ movement, products }) => {
    const product = products.find(p => p.id === movement.productId);
    const productName = product ? product.name : 'Produto Excluído';
    const date = movement.date?.toDate().toLocaleString('pt-BR') || 'Data indefinida';

    let icon, color, text;
    switch(movement.type) {
        case 'entrada': icon = 'fa-arrow-down'; color = 'text-green-500'; text = `<strong>${movement.quantity}x</strong> ${productName} entraram no estoque.`; break;
        case 'saida': icon = 'fa-arrow-up'; color = 'text-red-500'; text = `<strong>${movement.quantity}x</strong> ${productName} saíram do estoque.`; break;
        case 'ajuste': icon = 'fa-arrows-left-right-to-line'; color = 'text-blue-500'; text = `Ajuste de <strong>${Math.abs(movement.quantity)}x</strong> em ${productName}.`; break;
        default: icon = 'fa-exchange-alt'; color = 'text-gray-500'; text = `Movimentação de <strong>${movement.quantity}x</strong> ${productName}.`;
    }

    return (
        <li className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 ${color}`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <p className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: text }}></p>
                <p className="text-xs text-gray-500">{movement.motive || 'Sem motivo'} &bull; {date}</p>
            </div>
        </li>
    );
};

export default function HomePage() {
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const { docs: categories, loading: loadingCategories } = useFirestore('categories');
    const { docs: movements, loading: loadingMovements } = useFirestore('movements', { field: 'date', direction: 'desc' });

    const loading = loadingProducts || loadingCategories || loadingMovements;

    const totalItems = (products || []).reduce((acc, p) => acc + (p.totalQuantity || 0), 0);
    const lowStockCount = (products || []).filter(p => p.minStock > 0 && p.totalQuantity <= p.minStock).length;
    const recentMovements = (movements || []).slice(0, 7);

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Início</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total de Produtos" value={products.length} icon="fa-box" color="bg-blue-500" loading={loading} />
                <StatCard title="Total de Itens" value={totalItems} icon="fa-boxes-stacked" color="bg-green-500" loading={loading} />
                <StatCard title="Categorias" value={categories.length} icon="fa-tags" color="bg-purple-500" loading={loading} />
                <StatCard title="Estoque Baixo" value={lowStockCount} icon="fa-exclamation-triangle" color="bg-red-500" loading={loading} />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Atividade Recente</h3>
                {loading ? (
                    <p className="text-center text-gray-500 p-4">Carregando atividades...</p>
                ) : recentMovements.length > 0 ? (
                    <ul>
                        {recentMovements.map(mov => <ActivityItem key={mov.id} movement={mov} products={products} />)}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 p-4">Nenhuma atividade recente para mostrar.</p>
                )}
            </div>
        </div>
    );
}
