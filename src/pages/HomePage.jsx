import React, { useState, useMemo } from 'react';
import { 
  FaBox, FaBoxes, FaTags, FaExclamationTriangle, 
  FaArrowUp, FaArrowDown, FaExchangeAlt, FaCalendarAlt,
  FaChartLine, FaUsers, FaCog, FaPlus, FaEye,
  FaArrowRight, FaChevronUp, FaChevronDown
} from 'react-icons/fa';
import useFirestore from '../hooks/useFirestore';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, loading, onClick, description }) => (
  <div 
    className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${color} ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <div className="flex items-center space-x-2">
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {trend && (
              <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                {trend === 'up' ? <FaChevronUp className="w-3 h-3" /> : trend === 'down' ? <FaChevronDown className="w-3 h-3" /> : null}
                <span className="ml-1">{trendValue}</span>
              </div>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('border-l-', 'bg-').replace('-400', '-100')}`}>
        <Icon className={`text-xl ${color.replace('border-l-', 'text-').replace('-400', '-600')}`} />
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, color, onClick, badge }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105 border-l-4 ${color}`}
  >
    <div className="flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('border-l-', 'bg-').replace('-400', '-100')}`}>
        <Icon className={`text-lg ${color.replace('border-l-', 'text-').replace('-400', '-600')}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {badge && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">{badge}</span>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <FaArrowRight className="text-gray-400" />
    </div>
  </div>
);

const ActivityItem = ({ movement, products, locations }) => {
  const product = products?.find(p => p.id === movement.productId);
  const location = locations?.find(l => l.id === movement.locationId);
  const productName = product ? product.name : 'Produto não encontrado';
  const locationName = location ? location.name : movement.locationName || 'Local não especificado';
  
  let date = 'Data inválida';
  if (movement.timestamp?.toDate) {
    const moveDate = movement.timestamp.toDate();
    if (isToday(moveDate)) {
      date = `Hoje às ${format(moveDate, 'HH:mm')}`;
    } else if (isYesterday(moveDate)) {
      date = `Ontem às ${format(moveDate, 'HH:mm')}`;
    } else {
      date = format(moveDate, "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
    }
  }

  let icon, color, description;
  const quantityChanged = Math.abs(movement.quantityChanged || 0);
  
  if (movement.type === 'Entrada Inicial') {
    icon = FaArrowDown;
    color = 'text-green-600 bg-green-100';
    description = `Adicionado ${quantityChanged} ${product?.unit || 'un'} de ${productName}`;
  } else if (movement.type === 'Ajuste Manual' && movement.quantityChanged > 0) {
    icon = FaArrowUp;
    color = 'text-blue-600 bg-blue-100';
    description = `Entrada de ${quantityChanged} ${product?.unit || 'un'} de ${productName}`;
  } else if (movement.type === 'Ajuste Manual' && movement.quantityChanged < 0) {
    icon = FaArrowDown;
    color = 'text-red-600 bg-red-100';
    description = `Saída de ${quantityChanged} ${product?.unit || 'un'} de ${productName}`;
  } else {
    icon = FaExchangeAlt;
    color = 'text-gray-600 bg-gray-100';
    description = `Movimentação de ${productName}`;
  }

  return (
    <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
        {React.createElement(icon, { className: "w-4 h-4" })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{description}</p>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>{locationName}</span>
          <span>•</span>
          <span>{date}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {movement.quantityAfter || 0} {product?.unit || 'un'}
        </p>
        <p className="text-xs text-gray-500">Total</p>
      </div>
    </div>
  );
};

const LowStockItem = ({ product, locations }) => {
  const totalQuantity = Object.values(product.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  const stockLocations = Object.entries(product.locations || {})
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([locationId, qty]) => {
      const location = locations?.find(loc => loc.id === locationId);
      return location ? `${location.name}: ${qty}` : `${locationId}: ${qty}`;
    })
    .join(', ') || 'Sem estoque';

  const urgencyLevel = totalQuantity === 0 ? 'critical' : totalQuantity <= (product.minStock || 0) / 2 ? 'high' : 'medium';
  const urgencyColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-400 bg-orange-50',
    medium: 'border-yellow-400 bg-yellow-50'
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${urgencyColors[urgencyLevel]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{product.name}</h4>
          <p className="text-sm text-gray-600">{stockLocations}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{totalQuantity}</p>
          <p className="text-xs text-gray-500">Mín: {product.minStock || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7');
  
  const { docs: products, loading: loadingProducts } = useFirestore('products');
  const { docs: categories, loading: loadingCategories } = useFirestore('categories');
  const { docs: locations, loading: loadingLocations } = useFirestore('locations');
  const { docs: movements, loading: loadingMovements } = useFirestore('movements', { 
    field: 'timestamp', 
    direction: 'desc' 
  });

  const loading = loadingProducts || loadingCategories || loadingMovements || loadingLocations;

  const stats = useMemo(() => {
    if (!products || !categories || !movements) return {};

    const totalItems = products.reduce((acc, p) => {
      const quantity = Object.values(p.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
      return acc + quantity;
    }, 0);

    const lowStockProducts = products.filter(p => {
      const totalQuantity = Object.values(p.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
      return p.minStock > 0 && totalQuantity <= p.minStock;
    });

    const criticalStock = products.filter(p => {
      const totalQuantity = Object.values(p.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
      return totalQuantity === 0;
    });

    const daysAgo = parseInt(selectedTimeRange);
    const cutoffDate = subDays(new Date(), daysAgo);
    const recentMovements = movements.filter(m => {
      if (!m.timestamp?.toDate) return false;
      return m.timestamp.toDate() >= cutoffDate;
    });

    return {
      totalProducts: products.length,
      totalItems,
      totalCategories: categories.length,
      lowStockCount: lowStockProducts.length,
      criticalStockCount: criticalStock.length,
      recentMovements: movements.slice(0, 10),
      recentMovementsCount: recentMovements.length,
      lowStockProducts: lowStockProducts.slice(0, 5),
      criticalStock
    };
  }, [products, categories, movements, selectedTimeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu sistema de controle de estoque</p>
        </div>
        <div className="flex items-center space-x-3">
          <FaCalendarAlt className="text-gray-400" />
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Produtos" 
          value={stats.totalProducts || 0}
          icon={FaBox} 
          color="border-l-blue-400" 
          description="Produtos cadastrados"
          loading={loading}
        />
        <StatCard 
          title="Itens em Estoque" 
          value={stats.totalItems || 0}
          icon={FaBoxes} 
          color="border-l-green-400" 
          description="Quantidade total"
          loading={loading}
        />
        <StatCard 
          title="Categorias" 
          value={stats.totalCategories || 0}
          icon={FaTags} 
          color="border-l-purple-400" 
          description="Categorias ativas"
          loading={loading}
        />
        <StatCard 
          title="Estoque Baixo" 
          value={stats.lowStockCount || 0}
          icon={FaExclamationTriangle} 
          color="border-l-red-400" 
          description="Produtos com baixo estoque"
          trend={stats.criticalStockCount > 0 ? 'down' : null}
          trendValue={stats.criticalStockCount > 0 ? `${stats.criticalStockCount} críticos` : null}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Adicionar Produto"
            description="Cadastrar novo item no estoque"
            icon={FaPlus}
            color="border-l-blue-400"
            onClick={() => window.location.href = '#/cadastros'}
          />
          <QuickActionCard
            title="Ver Estoque"
            description="Visualizar todos os produtos"
            icon={FaEye}
            color="border-l-green-400"
            onClick={() => window.location.href = '#/estoque'}
          />
          <QuickActionCard
            title="Relatórios"
            description="Gerar relatórios detalhados"
            icon={FaChartLine}
            color="border-l-purple-400"
            onClick={() => window.location.href = '#/relatorios'}
            badge={stats.recentMovementsCount > 0 ? `${stats.recentMovementsCount} novos` : null}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Atividade Recente</h2>
            <span className="text-sm text-gray-500">{stats.recentMovements?.length || 0} movimentações</span>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {stats.recentMovements?.length > 0 ? (
              stats.recentMovements.map(movement => (
                <ActivityItem 
                  key={movement.id} 
                  movement={movement} 
                  products={products}
                  locations={locations}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <FaExchangeAlt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma movimentação recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Alertas de Estoque</h2>
            <span className="text-sm text-gray-500">{stats.lowStockCount || 0} produtos</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.lowStockProducts?.length > 0 ? (
              stats.lowStockProducts.map(product => (
                <LowStockItem 
                  key={product.id} 
                  product={product} 
                  locations={locations}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <FaBoxes className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">Todos os produtos com estoque adequado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
