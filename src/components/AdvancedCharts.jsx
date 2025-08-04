import React, { useMemo, useRef } from 'react';
import { ensureArray } from '../utils/arrayHelpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaDownload, FaInfoCircle } from 'react-icons/fa';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartContainer = ({ title, chartId, children, onExport }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg relative">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <button
        onClick={() => onExport(chartId, title)}
        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        aria-label={`Exportar gráfico ${title}`}
      >
        <FaDownload />
      </button>
    </div>
    <div id={chartId} className="h-80">
      {children}
    </div>
  </div>
);

const NoDataComponent = () => (
  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
    <FaInfoCircle className="mr-2" />
    <span>Não há dados para exibir.</span>
  </div>
);

const AdvancedCharts = ({ products = [], categories, loading = false }) => {
  const chartRefs = {
    categoryValue: useRef(null),
    abcAnalysis: useRef(null),
    topProducts: useRef(null),
    categoryQuantity: useRef(null),
  };

  // Configurações de tema para os gráficos
  const isDark = document.documentElement.classList.contains('dark');
  
  const chartColors = {
    primary: isDark ? '#3B82F6' : '#2563EB',
    secondary: isDark ? '#10B981' : '#059669',
    warning: isDark ? '#F59E0B' : '#D97706',
    danger: isDark ? '#EF4444' : '#DC2626',
    info: isDark ? '#8B5CF6' : '#7C3AED',
    success: isDark ? '#06D6A0' : '#10B981',
    text: isDark ? '#F3F4F6' : '#374151',
    grid: isDark ? '#374151' : '#E5E7EB'
  };

  const productsWithCalculatedValues = useMemo(() => {
    return products.map(product => {
      const totalQuantity = Object.values(product.locations || {})
        .filter(q => typeof q === 'number' && !isNaN(q))
        .reduce((sum, quantity) => sum + quantity, 0);
      const totalValue = totalQuantity * (product.price || 0);
      
      return {
        ...product,
        totalQuantity,
        totalValue
      };
    });
  }, [products]);

  // Dados para gráfico de valor por categoria
  const categoryValueData = useMemo(() => {
    const safeCategories = ensureArray(categories, 'categories');
    const categoryValues = safeCategories.map(category => {
      const categoryProducts = productsWithCalculatedValues.filter(p => p.categoryId === category.id);
      const totalValue = categoryProducts.reduce((sum, product) => sum + product.totalValue, 0);
      return {
        name: category.name,
        value: totalValue
      };
    }).sort((a, b) => b.value - a.value);

    return {
      labels: categoryValues.map(cat => cat.name),
      datasets: [{
        label: 'Valor em Estoque (R$)',
        data: categoryValues.map(cat => cat.value),
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary,
          chartColors.warning,
          chartColors.danger,
          chartColors.info,
          chartColors.success,
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ],
        borderColor: chartColors.text,
        borderWidth: 2,
        hoverBackgroundColor: chartColors.primary,
        hoverBorderColor: chartColors.text,
      }]
    };
  }, [productsWithCalculatedValues, categories, chartColors]);

  // Dados para gráfico de quantidade por categoria
  const categoryQuantityData = useMemo(() => {
    const safeCategories = ensureArray(categories, 'categories');
    const categoryQuantities = safeCategories.map(category => {
      const categoryProducts = productsWithCalculatedValues.filter(p => p.categoryId === category.id);
      const totalQuantity = categoryProducts.reduce((sum, product) => sum + product.totalQuantity, 0);
      return {
        name: category.name,
        quantity: totalQuantity,
        productCount: categoryProducts.length
      };
    }).sort((a, b) => b.quantity - a.quantity);

    return {
      labels: categoryQuantities.map(cat => cat.name),
      datasets: [
        {
          label: 'Quantidade em Estoque',
          data: categoryQuantities.map(cat => cat.quantity),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Número de Produtos',
          data: categoryQuantities.map(cat => cat.productCount),
          backgroundColor: chartColors.secondary,
          borderColor: chartColors.secondary,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };
  }, [productsWithCalculatedValues, categories, chartColors]);

  // Top 10 produtos por valor
  const topProductsData = useMemo(() => {
    const productsSorted = [...productsWithCalculatedValues].sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);

    return {
      labels: productsSorted.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
      datasets: [{
        label: 'Valor Total (R$)',
        data: productsSorted.map(p => p.totalValue),
        backgroundColor: chartColors.info,
        borderColor: chartColors.info,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }, [productsWithCalculatedValues, chartColors]);

  // Análise ABC para gráfico de rosca
  const abcAnalysisData = useMemo(() => {
    if (!productsWithCalculatedValues.length) return null;

    const productsSorted = [...productsWithCalculatedValues].sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = productsSorted.reduce((sum, p) => sum + p.totalValue, 0);
    if (totalValue === 0) return null;

    let cumulativeValue = 0;
    const abcCounts = { A: 0, B: 0, C: 0 };
    
    productsSorted.forEach(product => {
      cumulativeValue += product.totalValue;
      const cumulativePercent = (cumulativeValue / totalValue) * 100;
      
      if (cumulativePercent <= 80) abcCounts.A++;
      else if (cumulativePercent <= 95) abcCounts.B++;
      else abcCounts.C++;
    });

    return {
      labels: ['Classe A (80%)', 'Classe B (15%)', 'Classe C (5%)'],
      datasets: [{
        data: [abcCounts.A, abcCounts.B, abcCounts.C],
        backgroundColor: [chartColors.success, chartColors.warning, chartColors.danger],
        borderColor: [chartColors.success, chartColors.warning, chartColors.danger],
        borderWidth: 3,
        hoverBackgroundColor: [chartColors.success, chartColors.warning, chartColors.danger],
        hoverBorderColor: chartColors.text,
      }]
    };
  }, [productsWithCalculatedValues, chartColors]);

  const handleExportChart = (chartId, title) => {
    const chartRef = chartRefs[chartId];
    const chart = chartRef.current;
    if (chart) {
      const link = document.createElement('a');
      link.href = chart.toBase64Image('image/png', 1);
      link.download = `${title.replace(/ /g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Opções padrão para os gráficos
  const defaultOptions = {
// ... (o resto do arquivo permanece o mesmo)
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartColors.text,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.grid,
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: {
          color: chartColors.text,
          font: {
            size: 11
          }
        },
        grid: {
          color: chartColors.grid,
          borderColor: chartColors.grid,
        }
      },
      y: {
        ticks: {
          color: chartColors.text,
          font: {
            size: 11
          }
        },
        grid: {
          color: chartColors.grid,
          borderColor: chartColors.grid,
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: chartColors.text,
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.grid,
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} produtos (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-80 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2">
        <NoDataComponent />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartContainer title="Valor em Estoque por Categoria" chartId="categoryValue" onExport={handleExportChart}>
        <Bar ref={chartRefs.categoryValue} data={categoryValueData} options={defaultOptions} />
      </ChartContainer>

      <ChartContainer title="Análise ABC - Distribuição de Produtos" chartId="abcAnalysis" onExport={handleExportChart}>
        {abcAnalysisData ? <Doughnut ref={chartRefs.abcAnalysis} data={abcAnalysisData} options={doughnutOptions} /> : <NoDataComponent />}
      </ChartContainer>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top 10 Produtos por Valor Total
          </h3>
          <button
            onClick={() => handleExportChart('topProducts', 'Top 10 Produtos por Valor Total')}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            aria-label="Exportar gráfico Top 10 Produtos por Valor Total"
          >
            <FaDownload />
          </button>
        </div>
        <div id="topProducts" className="h-96">
          <Bar ref={chartRefs.topProducts} data={topProductsData} options={{
            ...defaultOptions,
            indexAxis: 'y',
            plugins: {
              ...defaultOptions.plugins,
              tooltip: {
                ...defaultOptions.plugins.tooltip,
                callbacks: {
                  label: (context) => {
                    const value = context.parsed.x;
                    return `Valor: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                  }
                }
              }
            },
            scales: {
              x: {
                ...defaultOptions.scales.x,
                ticks: {
                  ...defaultOptions.scales.x.ticks,
                  callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                }
              },
              y: {
                ...defaultOptions.scales.y,
                ticks: {
                  ...defaultOptions.scales.y.ticks,
                  maxTicksLimit: 10
                }
              }
            }
          }} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quantidade vs Número de Produtos por Categoria
          </h3>
          <button
            onClick={() => handleExportChart('categoryQuantity', 'Quantidade vs Número de Produtos por Categoria')}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            aria-label="Exportar gráfico Quantidade vs Número de Produtos por Categoria"
          >
            <FaDownload />
          </button>
        </div>
        <div id="categoryQuantity" className="h-80">
          <Bar ref={chartRefs.categoryQuantity} data={categoryQuantityData} options={{
            ...defaultOptions,
            plugins: {
              ...defaultOptions.plugins,
              tooltip: {
                ...defaultOptions.plugins.tooltip,
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label;
                    const value = context.parsed.y;
                    if (label === 'Quantidade em Estoque') {
                      return `${label}: ${value.toLocaleString('pt-BR')} unidades`;
                    }
                    return `${label}: ${value} produtos`;
                  }
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default AdvancedCharts;
