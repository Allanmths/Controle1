import React, { useState, useMemo } from 'react';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaArrowUp, 
  FaArrowDown,
  FaExclamationTriangle,
  FaEye,
  FaCalendarAlt,
  FaBell
} from 'react-icons/fa';
import AdvancedCharts from './AdvancedCharts';
import PredictiveAlerts from './PredictiveAlerts';

const AnalyticsDashboard = ({ products = [], movements = [], categories = [] }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Análise de dados em tempo real
  const analytics = useMemo(() => {
    if (!products.length) return null;

    // 1. Análise ABC - Classificação de produtos por valor
    const productsWithValue = products.map(product => {
      const totalValue = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + (quantity * (product.price || 0)), 0);
      
      return {
        ...product,
        totalValue,
        totalQuantity: Object.values(product.locations || {})
          .reduce((sum, quantity) => sum + quantity, 0)
      };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const totalValue = productsWithValue.reduce((sum, p) => sum + p.totalValue, 0);
    let cumulativeValue = 0;
    
    const abcAnalysis = productsWithValue.map(product => {
      cumulativeValue += product.totalValue;
      const cumulativePercent = (cumulativeValue / totalValue) * 100;
      
      let classification = 'C';
      if (cumulativePercent <= 80) classification = 'A';
      else if (cumulativePercent <= 95) classification = 'B';
      
      return { ...product, classification, cumulativePercent };
    });

    // 2. Produtos em baixo estoque (críticos)
    const lowStockProducts = products.filter(product => {
      const totalQuantity = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + quantity, 0);
      return totalQuantity <= (product.minStock || 5);
    });

    // 3. Produtos sem movimento (parados)
    const zeroStockProducts = products.filter(product => {
      const totalQuantity = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + quantity, 0);
      return totalQuantity === 0;
    });

    // 4. Top 10 produtos por valor
    const top10Products = abcAnalysis.slice(0, 10);

    // 5. Análise por categoria
    const categoryAnalysis = categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const totalValue = categoryProducts.reduce((sum, product) => {
        const productValue = Object.values(product.locations || {})
          .reduce((pSum, quantity) => pSum + (quantity * (product.price || 0)), 0);
        return sum + productValue;
      }, 0);
      
      const totalQuantity = categoryProducts.reduce((sum, product) => {
        const productQuantity = Object.values(product.locations || {})
          .reduce((pSum, quantity) => pSum + quantity, 0);
        return sum + productQuantity;
      }, 0);

      return {
        ...category,
        totalValue,
        totalQuantity,
        productCount: categoryProducts.length
      };
    }).sort((a, b) => b.totalValue - a.totalValue);

    // 6. KPIs principais
    const kpis = {
      totalProducts: products.length,
      totalValue: totalValue,
      avgProductValue: totalValue / products.length || 0,
      lowStockCount: lowStockProducts.length,
      zeroStockCount: zeroStockProducts.length,
      categoriesCount: categories.length
    };

    return {
      abcAnalysis,
      lowStockProducts,
      zeroStockProducts,
      top10Products,
      categoryAnalysis,
      kpis
    };
  }, [products, categories, selectedPeriod]);

  if (!analytics) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <FaChartLine className="mx-auto mb-4 text-4xl" />
          <p>Carregando dados analíticos...</p>
        </div>
      </div>
    );
  }

  const { abcAnalysis, lowStockProducts, top10Products, categoryAnalysis, kpis } = analytics;

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaChartLine className="text-blue-600" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Análise avançada do seu estoque</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Produtos</p>
              <p className="text-2xl font-bold">{kpis.totalProducts}</p>
            </div>
            <FaChartBar className="text-3xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Valor Total</p>
              <p className="text-2xl font-bold">R$ {kpis.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <FaArrowUp className="text-3xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Valor Médio</p>
              <p className="text-2xl font-bold">R$ {kpis.avgProductValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <FaChartPie className="text-3xl text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Estoque Baixo</p>
              <p className="text-2xl font-bold">{kpis.lowStockCount}</p>
            </div>
            <FaExclamationTriangle className="text-3xl text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Sem Estoque</p>
              <p className="text-2xl font-bold">{kpis.zeroStockCount}</p>
            </div>
            <FaArrowDown className="text-3xl text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Categorias</p>
              <p className="text-2xl font-bold">{kpis.categoriesCount}</p>
            </div>
            <FaCalendarAlt className="text-3xl text-indigo-200" />
          </div>
        </div>
      </div>

      {/* Análise ABC e Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise ABC */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaChartPie className="text-blue-600" />
            Análise ABC (Top 10)
          </h3>
          <div className="space-y-3">
            {abcAnalysis.slice(0, 10).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Classe {product.classification}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {product.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.totalQuantity} unid.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Análise por Categoria */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaChartBar className="text-green-600" />
            Performance por Categoria
          </h3>
          <div className="space-y-3">
            {categoryAnalysis.slice(0, 8).map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.productCount} produtos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    R$ {category.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.totalQuantity} unid.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas de Estoque */}
      {(lowStockProducts.length > 0 || analytics.zeroStockProducts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtos com Estoque Baixo */}
          {lowStockProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-600" />
                Estoque Baixo ({lowStockProducts.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockProducts.map((product) => {
                  const totalQuantity = Object.values(product.locations || {})
                    .reduce((sum, quantity) => sum + quantity, 0);
                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Mín: {product.minStock || 5} unid.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          {totalQuantity} unid.
                        </p>
                        <FaArrowDown className="text-orange-600 ml-auto" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Produtos Sem Estoque */}
          {analytics.zeroStockProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaArrowDown className="text-red-600" />
                Sem Estoque ({analytics.zeroStockProducts.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.zeroStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reposição urgente
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        0 unid.
                      </p>
                      <FaExclamationTriangle className="text-red-600 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alertas Preditivos */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FaBell className="text-yellow-600" />
          Alertas Inteligentes & Previsões
        </h3>
        <PredictiveAlerts products={products} movements={movements} />
      </div>

      {/* Gráficos Avançados */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FaChartLine className="text-blue-600" />
          Análise Visual Avançada
        </h3>
        <AdvancedCharts products={products} categories={categories} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
