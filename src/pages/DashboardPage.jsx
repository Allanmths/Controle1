import React, { useState, useMemo, useEffect } from 'react';
import useFirestore from '../hooks/useFirestore';
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
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaFilePdf } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const chartTypes = [
    { key: 'bar', name: 'Barra' },
    { key: 'line', name: 'Linha' },
    { key: 'pie', name: 'Pizza' },
];

const periodOptions = {
    'last7days': 'Ãšltimos 7 dias',
    'last30days': 'Ãšltimos 30 dias',
    'thisMonth': 'Este MÃªs',
    'lastMonth': 'MÃªs Passado',
    'custom': 'Personalizado'
};

export default function DashboardPage() {
  const [chartType, setChartType] = useState('bar');
  const [periodOption, setPeriodOption] = useState('last7days');
  const [dateRange, setDateRange] = useState([subDays(new Date(), 6), new Date()]);
  const [startDate, endDate] = dateRange;

  // State for report generator
  const [reportCategory, setReportCategory] = useState('all');
  const [reportStatus, setReportStatus] = useState('all');

  const { docs: products, loading: loadingProducts } = useFirestore('products');
  const { docs: categories, loading: loadingCategories } = useFirestore('categories');
  const { docs: movements, loading: loadingMovements } = useFirestore('movements', { orderBy: ['timestamp', 'desc'] });

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
            // No-op, dateRange is set by DatePicker
            break;
        default:
            setDateRange([startOfDay(subDays(now, 6)), endOfDay(now)]);
    }
  }, [periodOption]);

  const lowStockProducts = useMemo(() => {
    return (products || [])
      .map(p => {
        const totalQuantity = Object.values(p.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
        return { ...p, totalQuantity };
      })
      .filter(p => {
        const minStock = p.minStock || 0;
        if (minStock <= 0) {
          return false;
        }
        return p.totalQuantity <= minStock;
      });
  }, [products]);

  const top5Entries = useMemo(() => 
    movements.filter(m => 
      m.type === 'Entrada Inicial' || 
      m.type === 'Ajuste Manual' && (m.quantityChanged > 0)
    ).slice(0, 5)
  , [movements]);

  const top5Exits = useMemo(() => 
    movements.filter(m => 
      m.type === 'Ajuste Manual' && (m.quantityChanged < 0)
    ).slice(0, 5)
  , [movements]);

  const movementsChartData = useMemo(() => {
    const filteredMovements = movements.filter(mov => {
      const moveDate = mov.timestamp?.toDate();
      if (!moveDate || !startDate || !endDate) return false;
      return moveDate >= startDate && moveDate <= endDate;
    });

    if (chartType === 'pie') {
      const entries = (filteredMovements || []).filter(m => 
        m.type === 'Entrada Inicial' || 
        (m.type === 'Ajuste Manual' && m.quantityChanged > 0)
      ).reduce((sum, m) => sum + Math.abs(m.quantityChanged || 0), 0);
      
      const exits = (filteredMovements || []).filter(m => 
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
      const day = format(mov.timestamp.toDate(), 'dd/MM');
      if (!acc[day]) {
        acc[day] = { entrada: 0, saida: 0 };
      }
      
      // Determinar se Ã© entrada ou saÃ­da baseado no tipo e quantidade
      if (mov.type === 'Entrada Inicial' || (mov.type === 'Ajuste Manual' && mov.quantityChanged > 0)) {
        acc[day].entrada += Math.abs(mov.quantityChanged || 0);
      } else if (mov.type === 'Ajuste Manual' && mov.quantityChanged < 0) {
        acc[day].saida += Math.abs(mov.quantityChanged || 0);
      }
      
      return acc;
    }, {});

    const labels = Object.keys(groupedByDay).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

    return {
      labels,
      datasets: [
        { label: 'Entradas', data: (labels || []).map(day => groupedByDay[day].entrada), backgroundColor: '#16a34a' },
        { label: 'Saídas', data: (labels || []).map(day => groupedByDay[day].saida), backgroundColor: '#dc2626' },
      ],
    };
  }, [movements, startDate, endDate, chartType]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
  };

  const ChartComponent = useMemo(() => {
    if (chartType === 'line') return Line;
    if (chartType === 'pie') return Pie;
    return Bar;
  }, [chartType]);

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

    const tableColumn = ["Nome", "Categoria", "Quantidade", "Preço Unit.", "Valor Total"];
    const tableRows = [];

    filteredProducts.forEach(product => {
        const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'N/A';
        const price = product.price || 0;
        const totalValue = price * product.totalQuantity;

        const productData = [
            product.name,
            categoryName,
            product.totalQuantity,
            price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ];
        tableRows.push(productData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 35 });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`PÃ¡gina ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`relatorio_estoque_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loadingProducts || loadingMovements || loadingCategories) {
    return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard de Movimentações</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de GrÃ¡fico</label>
            <div className="flex items-center border border-gray-300 rounded-md p-0.5 w-min">
                {chartTypes.map(({key, name}) => (
                    <button key={key} onClick={() => setChartType(key)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${chartType === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {name}
                    </button>
                ))}
            </div>
          </div>
          <div>
            <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-1">PerÃ­odo</label>
            <select id="period-select" value={periodOption} onChange={e => setPeriodOption(e.target.value)} className="w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm">
                {Object.entries(periodOptions).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
            </select>
            {periodOption === 'custom' && (
                <div className="mt-2">
                    <DatePicker
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(update) => setDateRange(update)}
                        isClearable={true}
                        className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
                        dateFormat="dd/MM/yyyy"
                    />
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <ChartComponent options={chartOptions} data={movementsChartData} />
        </div>
        <div className="space-y-6">
            <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <h3 className="font-bold text-yellow-800 mb-2">Alerta de Estoque Baixo</h3>
                <div className="space-y-1 text-sm text-yellow-700 max-h-40 overflow-y-auto">
                    {lowStockProducts && lowStockProducts.length > 0 ? (
                        lowStockProducts.map(p => <p key={p.id}>{p.name}: <span className="font-semibold">{p.totalQuantity}</span> / {p.minStock} {p.unit || 'UN'}</p>)
                    ) : <p>Nenhum produto com estoque baixo.</p>}
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="font-bold text-green-700 mb-2">Top 5 Entradas Recentes</h3>
                <div className="space-y-1 text-sm text-gray-600">
                    {top5Entries && top5Entries.length > 0 ? (
                        top5Entries.map(m => <p key={m.id}><span className="font-semibold">{m.quantity}x</span> {m.productName}</p>)
                    ) : <p>Nenhuma entrada recente.</p>}
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="font-bold text-red-700 mb-2">Top 5 Saídas Recentes</h3>
                <div className="space-y-1 text-sm text-gray-600">
                    {top5Exits && top5Exits.length > 0 ? (
                        top5Exits.map(m => <p key={m.id}><span className="font-semibold">{m.quantity}x</span> {m.productName}</p>)
                    ) : <p>Nenhuma saÃ­da recente.</p>}
                </div>
            </div>
        </div>
      </div>

      {/* Gerador de Relatório */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Gerar Relatório de Estoque</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
                <label htmlFor="report-category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select id="report-category" value={reportCategory} onChange={(e) => setReportCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="all">Todas</option>
        {(Array.isArray(categories) && categories.length > 0) ? (
            (Array.isArray(categories) ? categories : []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)
        ) : (
            <option value="" disabled>Carregando categorias...</option>
        )}
                </select>
            </div>
            <div>
                <label htmlFor="report-status" className="block text-sm font-medium text-gray-700 mb-1">Status do Estoque</label>
                <select id="report-status" value={reportStatus} onChange={(e) => setReportStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="all">Todos</option>
                    <option value="in_stock">Em estoque</option>
                    <option value="low_stock">Baixo estoque</option>
                    <option value="out_of_stock">Sem estoque</option>
                </select>
            </div>
            <button onClick={handleGenerateReport} className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">
                <FaFilePdf className="mr-2" />
                Gerar Relatório
            </button>
        </div>
      </div>
    </div>
  );
}
