import React, { useMemo } from 'react';
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

const AdvancedCharts = ({ products = [], categories = [] }) => {
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

  // Dados para grÃ¡fico de valor por categoria
  const categoryValueData = useMemo(() => {
    const categoryValues = (Array.isArray(categories) ? categories : []).map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const totalValue = categoryProducts.reduce((sum, product) => {
        const productValue = Object.values(product.locations || {})
          .reduce((pSum, quantity) => pSum + (quantity * (product.price || 0)), 0);
        return sum + productValue;
      }, 0);
      
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
  }, [products, categories, chartColors]);

  // Dados para grÃ¡fico de quantidade por categoria
  const categoryQuantityData = useMemo(() => {
    const categoryQuantities = (Array.isArray(categories) ? categories : []).map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const totalQuantity = categoryProducts.reduce((sum, product) => {
        const productQuantity = Object.values(product.locations || {})
          .reduce((pSum, quantity) => pSum + quantity, 0);
        return sum + productQuantity;
      }, 0);
      
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
          label: 'NÃºmero de Produtos',
          data: categoryQuantities.map(cat => cat.productCount),
          backgroundColor: chartColors.secondary,
          borderColor: chartColors.secondary,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };
  }, [products, categories, chartColors]);

  // Top 10 produtos por valor
  const topProductsData = useMemo(() => {
    const productsWithValue = products.map(product => {
      const totalValue = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + (quantity * (product.price || 0)), 0);
      
      return {
        ...product,
        totalValue
      };
    }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);

    return {
      labels: productsWithValue.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
      datasets: [{
        label: 'Valor Total (R$)',
        data: productsWithValue.map(p => p.totalValue),
        backgroundColor: chartColors.info,
        borderColor: chartColors.info,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }, [products, chartColors]);

  // Análise ABC para gráfico de rosca
  const abcAnalysisData = useMemo(() => {
    if (!products.length) return null;

    const productsWithValue = products.map(product => {
      const totalValue = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + (quantity * (product.price || 0)), 0);
      return { ...product, totalValue };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const totalValue = productsWithValue.reduce((sum, p) => sum + p.totalValue, 0);
    let cumulativeValue = 0;
    
    const abcCounts = { A: 0, B: 0, C: 0 };
    
    productsWithValue.forEach(product => {
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
  }, [products, chartColors]);

  // Opções padrão para os gráficos
  const defaultOptions = {
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
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} produtos (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* GrÃ¡fico de Valor por Categoria */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Valor em Estoque por Categoria
        </h3>
        <div className="h-80">
          <Bar data={categoryValueData} options={defaultOptions} />
        </div>
      </div>

      {/* Análise ABC */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Análise ABC - Distribuição de Produtos
        </h3>
        <div className="h-80">
          {abcAnalysisData && <Doughnut data={abcAnalysisData} options={doughnutOptions} />}
        </div>
      </div>

      {/* Top 10 Produtos por Valor */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top 10 Produtos por Valor Total
        </h3>
        <div className="h-96">
          <Bar data={topProductsData} options={{
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

      {/* Comparativo Quantidade vs Produtos por Categoria */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quantidade vs NÃºmero de Produtos por Categoria
        </h3>
        <div className="h-80">
          <Bar data={categoryQuantityData} options={{
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
