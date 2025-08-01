import React, { useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaFilePdf, FaChartBar, FaChartPie, FaArrowUp, FaArrowDown, FaExclamationTriangle, FaCalendarAlt, FaBell } from 'react-icons/fa';
import AdvancedCharts from './AdvancedCharts';
import PredictiveAlerts from './PredictiveAlerts';

const AnalyticsDashboard = ({ products = [], movements = [], categories = [] }) => {
  // KPIs
  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + Object.values(p.locations || {}).reduce((s, q) => s + (q * (p.price || 0)), 0), 0);
    const avgProductValue = totalProducts ? totalValue / totalProducts : 0;
    const lowStockCount = products.filter(p => Object.values(p.locations || {}).reduce((s, q) => s + q, 0) <= (p.minStock || 5)).length;
    const zeroStockCount = products.filter(p => Object.values(p.locations || {}).reduce((s, q) => s + q, 0) === 0).length;
    const categoriesCount = Array.isArray(categories) ? categories.length : 0;
    return { totalProducts, totalValue, avgProductValue, lowStockCount, zeroStockCount, categoriesCount };
  }, [products, categories]);

  // Relatórios resumidos
  const stockPositionRows = useMemo(() => products.map(p => ({
    name: p.name,
    category: (categories.find(c => c.id === p.categoryId)?.name) || '-',
    totalQuantity: Object.values(p.locations || {}).reduce((s, q) => s + q, 0),
    totalValue: Object.values(p.locations || {}).reduce((s, q) => s + (q * (p.price || 0)), 0)
  })), [products, categories]);

  const lowStockRows = useMemo(() => products.filter(p => Object.values(p.locations || {}).reduce((s, q) => s + q, 0) <= (p.minStock || 5)).map(p => ({
    name: p.name,
    category: (categories.find(c => c.id === p.categoryId)?.name) || '-',
    totalQuantity: Object.values(p.locations || {}).reduce((s, q) => s + q, 0),
    minStock: p.minStock || 5
  })), [products, categories]);

  const zeroStockRows = useMemo(() => products.filter(p => Object.values(p.locations || {}).reduce((s, q) => s + q, 0) === 0).map(p => ({
    name: p.name,
    category: (categories.find(c => c.id === p.categoryId)?.name) || '-',
  })), [products, categories]);

  // Exportações PDF
  function exportStockPositionPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório Geral de Posição de Estoque', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    const tableColumn = ['Produto', 'Categoria', 'Qtd. Total', 'Valor Total (R$)'];
    const tableRows = stockPositionRows.map(r => [r.name, r.category, r.totalQuantity, r.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 38 });
    doc.save(`relatorio_geral_estoque_${new Date().toISOString().slice(0,10)}.pdf`);
  }
  function exportLowStockPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Produtos com Estoque Baixo', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    const tableColumn = ['Produto', 'Categoria', 'Qtd. Total', 'Estoque Mínimo'];
    const tableRows = lowStockRows.map(r => [r.name, r.category, r.totalQuantity, r.minStock]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 38 });
    doc.save(`relatorio_estoque_baixo_${new Date().toISOString().slice(0,10)}.pdf`);
  }
  function exportZeroStockPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Produtos Sem Estoque', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    const tableColumn = ['Produto', 'Categoria'];
    const tableRows = zeroStockRows.map(r => [r.name, r.category]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 38 });
    doc.save(`relatorio_sem_estoque_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <FaChartBar className="text-blue-600" /> Relatórios de Estoque
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Visualize, filtre e exporte relatórios completos do seu estoque.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
          <p className="text-blue-100 text-sm">Total de Produtos</p>
          <p className="text-2xl font-bold">{kpis.totalProducts}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg">
          <p className="text-green-100 text-sm">Valor Total</p>
          <p className="text-2xl font-bold">R$ {kpis.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
          <p className="text-purple-100 text-sm">Valor Médio</p>
          <p className="text-2xl font-bold">R$ {kpis.avgProductValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg">
          <p className="text-orange-100 text-sm">Estoque Baixo</p>
          <p className="text-2xl font-bold">{kpis.lowStockCount}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg shadow-lg">
          <p className="text-red-100 text-sm">Sem Estoque</p>
          <p className="text-2xl font-bold">{kpis.zeroStockCount}</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg shadow-lg">
          <p className="text-indigo-100 text-sm">Categorias</p>
          <p className="text-2xl font-bold">{kpis.categoriesCount}</p>
        </div>
      </div>

      {/* Exportação PDF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={exportStockPositionPDF} className="flex items-center px-4 py-3 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition-colors font-semibold">
          <FaFilePdf className="mr-2" /> Exportar Relatório Geral
        </button>
        <button onClick={exportLowStockPDF} className="flex items-center px-4 py-3 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition-colors font-semibold">
          <FaFilePdf className="mr-2" /> Exportar Baixo Estoque
        </button>
        <button onClick={exportZeroStockPDF} className="flex items-center px-4 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors font-semibold">
          <FaFilePdf className="mr-2" /> Exportar Sem Estoque
        </button>
      </div>

      {/* Tabelas Resumidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-blue-600" /> Posição Geral do Estoque
          </h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Produto</th>
                <th className="p-2 text-left">Categoria</th>
                <th className="p-2 text-right">Qtd. Total</th>
                <th className="p-2 text-right">Valor Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              {stockPositionRows.slice(0, 15).map((row, i) => (
                <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.category}</td>
                  <td className="p-2 text-right">{row.totalQuantity}</td>
                  <td className="p-2 text-right">R$ {row.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-600" /> Produtos com Estoque Baixo
          </h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Produto</th>
                <th className="p-2 text-left">Categoria</th>
                <th className="p-2 text-right">Qtd. Total</th>
                <th className="p-2 text-right">Estoque Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {lowStockRows.slice(0, 15).map((row, i) => (
                <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.category}</td>
                  <td className="p-2 text-right">{row.totalQuantity}</td>
                  <td className="p-2 text-right">{row.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaArrowDown className="text-red-600" /> Produtos Sem Estoque
        </h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-2 text-left">Produto</th>
              <th className="p-2 text-left">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {zeroStockRows.slice(0, 20).map((row, i) => (
              <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráficos Avançados */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FaChartPie className="text-blue-600" /> Análise Visual Avançada
        </h3>
        <AdvancedCharts products={products} categories={categories} />
      </div>

      {/* Alertas Preditivos */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FaBell className="text-yellow-600" /> Alertas Inteligentes & Previsões
        </h3>
        <PredictiveAlerts products={products} movements={movements} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
