﻿import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from   const productName    } else {
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
    description = `Saída de ${quantityChanged} ${product?.unit || 'un'} de ${productName}`;.name : 'Produto não encontrado';
  const locationName = location ? location.name : movement.locationName || 'Local não especificado';
  
  let date = 'Data inválida';
  if (movement.timestamp?.toDate) {
    const moveDate = movement.timestamp.toDate();
    if (isToday(moveDate)) {
      date = `Hoje às ${format(moveDate, 'HH:mm')}`;
    } else if (isYesterday(moveDate)) {
      date = `Ontem às ${format(moveDate, 'HH:mm')}`;ter-dom';
import { 
  FaBox, FaBoxes, FaTags, FaExclamationTriangle, 
  FaArrowUp, FaArrowDown, FaExchangeAlt, FaCalendarAlt,
  FaChartLine, FaUsers, FaCog, FaPlus, FaEye,
  FaArrowRight, FaChevronUp, FaChevronDown, FaFilePdf,
  FaChartBar, FaChartPie, FaChartArea
} from 'react-icons/fa';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useFirestore from '../hooks/useFirestore';
import { format, isToday, isYesterday, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

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
  const productName = product ? product.name : 'Produto nÃ£o encontrado';
  const locationName = location ? location.name : movement.locationName || 'Local nÃ£o especificado';
  
  let date = 'Data invÃ¡lida';
  if (movement.timestamp?.toDate) {
    const moveDate = movement.timestamp.toDate();
    if (isToday(moveDate)) {
      date = `Hoje Ã s ${format(moveDate, 'HH:mm')}`;
    } else if (isYesterday(moveDate)) {
      date = `Ontem Ã s ${format(moveDate, 'HH:mm')}`;
    } else {
      date = format(moveDate, "dd 'de' MMM 'Ã s' HH:mm", { locale: ptBR });
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
    description = `SaÃ­da de ${quantityChanged} ${product?.unit || 'un'} de ${productName}`;
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

  // Componente para renderizar grÃ¡ficos
  const ChartComponent = ({ options, data }) => {
    if (chartType === 'bar') {
      return <Bar options={options} data={data} />;
    } else if (chartType === 'line') {
      return <Line options={options} data={data} />;
    } else if (chartType === 'pie') {
      return <Pie options={options} data={data} />;
    }
    return null;
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
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7');
  const [chartType, setChartType] = useState('bar');
  const [periodOption, setPeriodOption] = useState('last7days');
  const [dateRange, setDateRange] = useState([subDays(new Date(), 6), new Date()]);
  const [startDate, endDate] = dateRange;
  const [reportCategory, setReportCategory] = useState('all');
  const [reportStatus, setReportStatus] = useState('all');
  
  const { docs: products, loading: loadingProducts } = useFirestore('products');
  const { docs: categories, loading: loadingCategories } = useFirestore('categories');
  const { docs: locations, loading: loadingLocations } = useFirestore('locations');
  const { docs: movements, loading: loadingMovements } = useFirestore('movements', { 
    field: 'timestamp', 
    direction: 'desc' 
  });

  const loading = loadingProducts || loadingCategories || loadingMovements || loadingLocations;

  // Atualizar dateRange quando periodOption muda
  useEffect(() => {
    const now = new Date();
    switch (periodOption) {
      case 'last7days':
        setDateRange([startOfDay(subDays(now, 6)), endOfDay(now)]);
        break;
      case 'last30days':
        setDateRange([startOfDay(subDays(now, 29)), endOfDay(now)]);
        break;
      case 'thisMonth':
        setDateRange([startOfMonth(now), endOfMonth(now)]);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateRange([startOfMonth(lastMonth), endOfMonth(lastMonth)]);
        break;
      case 'custom':
        // No-op, dateRange Ã© definido pelo DatePicker
        break;
      default:
        setDateRange([startOfDay(subDays(now, 6)), endOfDay(now)]);
    }
  }, [periodOption]);

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

  // Dados para gráficos de movimentação
  const movementsChartData = useMemo(() => {
    if (!movements || !startDate || !endDate) return { labels: [], datasets: [] };

    const filteredMovements = movements.filter(mov => {
      const moveDate = mov.timestamp?.toDate();
      if (!moveDate) return false;
      return moveDate >= startDate && moveDate <= endDate;
    });

    if (chartType === 'pie') {
      const entries = filteredMovements.filter(m => 
        m.type === 'Entrada Inicial' || 
        (m.type === 'Ajuste Manual' && m.quantityChanged > 0)
      ).reduce((sum, m) => sum + Math.abs(m.quantityChanged || 0), 0);
      
      const exits = filteredMovements.filter(m => 
        m.type === 'Ajuste Manual' && m.quantityChanged < 0
      ).reduce((sum, m) => sum + Math.abs(m.quantityChanged || 0), 0);
      
      return {
        labels: ['Entradas', 'Saídas'],
        datasets: [{
          data: [entries, exits],
          backgroundColor: ['#16a34a', '#dc2626'],
          borderColor: ['#15803d', '#b91c1c'],
          borderWidth: 1,
        }]
      };
    }

    const groupedByDay = filteredMovements.reduce((acc, mov) => {
      if (!mov.timestamp?.toDate) return acc;
      const day = format(mov.timestamp.toDate(), 'dd/MM');
      if (!acc[day]) {
        acc[day] = { entrada: 0, saida: 0 };
      }
      
      if (mov.type === 'Entrada Inicial' || (mov.type === 'Ajuste Manual' && mov.quantityChanged > 0)) {
        acc[day].entrada += Math.abs(mov.quantityChanged || 0);
      } else if (mov.type === 'Ajuste Manual' && mov.quantityChanged < 0) {
        acc[day].saida += Math.abs(mov.quantityChanged || 0);
      }
      
      return acc;
    }, {});

    const labels = Object.keys(groupedByDay).sort((a, b) => 
      new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))
    );

    return {
      labels,
      datasets: [
        { 
          label: 'Entradas', 
          data: labels.map(day => groupedByDay[day]?.entrada || 0), 
          backgroundColor: '#16a34a',
          borderColor: '#15803d',
          borderWidth: 2
        },
        { 
          label: 'Saídas', 
          data: labels.map(day => groupedByDay[day]?.saida || 0), 
          backgroundColor: '#dc2626',
          borderColor: '#b91c1c',
          borderWidth: 2
        },
      ],
    };
  }, [movements, startDate, endDate, chartType]);

  const chartOptions = {
    responsive: true,
    plugins: { 
      legend: { position: 'top' }, 
      title: { display: false } 
    },
    scales: chartType !== 'pie' ? { 
      x: { grid: { display: false } }, 
      y: { beginAtZero: true } 
    } : {}
  };

  const ChartComponent = useMemo(() => {
    if (chartType === 'line') return Line;
    if (chartType === 'pie') return Pie;
    return Bar;
  }, [chartType]);

  // Função para gerar relatório
  const handleGenerateReport = () => {
    const augmentedProducts = (products || []).map(p => ({
      ...p,
      totalQuantity: Object.values(p.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0),
    }));

    const filteredProducts = augmentedProducts.filter(product => {
      const categoryMatch = reportCategory === 'all' || product.categoryId === reportCategory;
      const minStock = product.minStock || 0;

      let statusMatch = false;
      switch (reportStatus) {
        case 'in_stock':
          statusMatch = product.totalQuantity > 0;
          break;
        case 'low_stock':
          statusMatch = minStock > 0 && product.totalQuantity <= minStock;
          break;
        case 'out_of_stock':
          statusMatch = product.totalQuantity <= 0;
          break;
        case 'all':
        default:
          statusMatch = true;
          break;
      }

      return categoryMatch && statusMatch;
    });

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Estoque', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 30);

    const tableColumn = ["Nome", "Categoria", "Quantidade", "Custo Unit.", "Valor Total"];
    const tableRows = [];

    filteredProducts.forEach(product => {
      const categoryName = categories?.find(c => c.id === product.categoryId)?.name || 'N/A';
      const cost = product.cost || 0;
      const totalValue = cost * product.totalQuantity;

      const productData = [
        product.name,
        categoryName,
        product.totalQuantity,
        cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
      tableRows.push(productData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 35 });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`relatorio_estoque_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

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
          <p className="text-gray-600 mt-1">Visão geral completa do seu sistema de controle de estoque</p>
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
            onClick={() => navigate('/registers')}
          />
          <QuickActionCard
            title="Ver Estoque"
            description="Visualizar todos os produtos"
            icon={FaEye}
            color="border-l-green-400"
            onClick={() => navigate('/stock')}
          />
          <QuickActionCard
            title="RelatÃ³rios"
            description="Gerar relatÃ³rios detalhados"
            icon={FaChartLine}
            color="border-l-purple-400"
            onClick={() => navigate('/reports')}
            badge={stats.recentMovementsCount > 0 ? `${stats.recentMovementsCount} novos` : null}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">AnÃ¡lise de MovimentaÃ§Ãµes</h2>
          <div className="flex items-center space-x-4">
            {/* Chart Type Selector */}
            <div className="flex items-center border border-gray-300 rounded-lg p-1">
              <button 
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-md transition-colors ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="GrÃ¡fico de Barras"
              >
                <FaChartBar />
              </button>
              <button 
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-colors ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="GrÃ¡fico de Linha"
              >
                <FaChartArea />
              </button>
              <button 
                onClick={() => setChartType('pie')}
                className={`p-2 rounded-md transition-colors ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="GrÃ¡fico de Pizza"
              >
                <FaChartPie />
              </button>
            </div>
            
            {/* Period Selector */}
            <select 
              value={periodOption} 
              onChange={(e) => setPeriodOption(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="last7days">Últimos 7 dias</option>
              <option value="last30days">Últimos 30 dias</option>
              <option value="thisMonth">Este Mês</option>
              <option value="lastMonth">Mês Passado</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        {periodOption === 'custom' && (
          <div className="mb-4">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              isClearable={true}
              className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecione o período"
            />
          </div>
        )}

        <div className="h-96">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ChartComponent options={chartOptions} data={movementsChartData} />
          )}
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
                <p className="text-gray-500">Nenhuma movimentaÃ§Ã£o recente</p>
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

      {/* Reports Section */}
      <div id="reports-section" className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerador de RelatÃ³rios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select 
              value={reportCategory} 
              onChange={(e) => setReportCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status do Estoque</label>
            <select 
              value={reportStatus} 
              onChange={(e) => setReportStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="in_stock">Em estoque</option>
              <option value="low_stock">Baixo estoque</option>
              <option value="out_of_stock">Sem estoque</option>
            </select>
          </div>
          <button 
            onClick={handleGenerateReport}
            className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors"
          >
            <FaFilePdf className="mr-2" />
            Gerar RelatÃ³rio
          </button>
        </div>
      </div>
    </div>
  );
}
