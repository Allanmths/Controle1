import React, { useMemo } from 'react';
import { 
  FaExclamationTriangle, 
  FaBell, 
  FaArrowDown, 
  FaArrowUp,
  FaInfoCircle,
  FaChartLine,
  FaClock,
  FaBoxOpen
} from 'react-icons/fa';

const PredictiveAlerts = ({ products = [], movements = [] }) => {
  // Algoritmos de previsão e alertas
  const predictions = useMemo(() => {
    const alerts = [];
    const trends = [];
    const predictions = [];
    
    // 1. Análise de Tendência de Consumo
    products.forEach(product => {
      const totalQuantity = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + quantity, 0);
      
      // Produtos com estoque crítico
      if (totalQuantity <= (product.minStock || 5) && totalQuantity > 0) {
        alerts.push({
          type: 'warning',
          priority: 'medium',
          product: product.name,
          message: `Estoque baixo: ${totalQuantity} unidades restantes`,
          action: 'Repor estoque',
          icon: FaExclamationTriangle,
          color: 'orange'
        });
      }
      
      // Produtos sem estoque
      if (totalQuantity === 0) {
        alerts.push({
          type: 'danger',
          priority: 'high',
          product: product.name,
          message: 'Produto sem estoque',
          action: 'Reposição urgente necessária',
          icon: FaExclamationTriangle,
          color: 'red'
        });
      }
      
      // Produtos com estoque excessivo (acima de 100 unidades)
      if (totalQuantity > 100) {
        alerts.push({
          type: 'info',
          priority: 'low',
          product: product.name,
          message: `Estoque alto: ${totalQuantity} unidades`,
          action: 'Considerar promoção ou redistribuição',
          icon: FaInfoCircle,
          color: 'blue'
        });
      }
      
      // Análise de valor parado (produtos com alto valor e sem movimento)
      const productValue = totalQuantity * (product.price || 0);
      if (productValue > 1000 && totalQuantity > 50) {
        trends.push({
          type: 'insight',
          product: product.name,
          message: `Alto valor em estoque: R$ ${productValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          suggestion: 'Analisar rotatividade e considerar estratégias de venda',
          icon: FaChartLine,
          color: 'purple'
        });
      }
    });
    
    // 2. Previsões Simples baseadas em padrões
    const lowRotationProducts = products.filter(product => {
      const totalQuantity = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + quantity, 0);
      return totalQuantity > 20 && (product.price || 0) > 0;
    }).slice(0, 5);
    
    lowRotationProducts.forEach(product => {
      const totalQuantity = Object.values(product.locations || {})
        .reduce((sum, quantity) => sum + quantity, 0);
      
      // Simulação de previsão de consumo (baseada em estoque atual)
      const estimatedDaysToFinish = Math.round(totalQuantity / 2); // Consumo estimado de 2 unidades por dia
      
      if (estimatedDaysToFinish <= 15) {
        predictions.push({
          type: 'prediction',
          product: product.name,
          message: `Previsão de esgotamento em ${estimatedDaysToFinish} dias`,
          suggestion: 'Programar reposição',
          icon: FaClock,
          color: 'yellow',
          daysLeft: estimatedDaysToFinish
        });
      }
    });
    
    return {
      alerts: alerts.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      }),
      trends,
      predictions
    };
  }, [products, movements]);

  const { alerts, trends, predictions: predictiveData } = predictions;

  // Componente para renderizar um alerta
  const AlertCard = ({ alert }) => {
    const bgColor = {
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    };
    
    const textColor = {
      red: 'text-red-800 dark:text-red-200',
      orange: 'text-orange-800 dark:text-orange-200',
      blue: 'text-blue-800 dark:text-blue-200',
      yellow: 'text-yellow-800 dark:text-yellow-200',
      purple: 'text-purple-800 dark:text-purple-200'
    };
    
    const iconColor = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      blue: 'text-blue-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600'
    };

    return (
      <div className={`p-4 rounded-lg border-l-4 ${bgColor[alert.color]}`}>
        <div className="flex items-start">
          <alert.icon className={`mt-1 mr-3 text-lg ${iconColor[alert.color]}`} />
          <div className="flex-1">
            <h4 className={`font-semibold ${textColor[alert.color]}`}>
              {alert.product}
            </h4>
            <p className={`text-sm mt-1 ${textColor[alert.color]}`}>
              {alert.message}
            </p>
            <p className={`text-xs mt-2 font-medium ${textColor[alert.color]}`}>
              ðŸ’¡ {alert.action || alert.suggestion}
            </p>
            {alert.daysLeft && (
              <div className={`text-xs mt-2 font-bold ${textColor[alert.color]}`}>
                â° {alert.daysLeft} dias restantes
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (alerts.length === 0 && trends.length === 0 && predictiveData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <FaBell className="mx-auto mb-4 text-4xl" />
          <p>Nenhum alerta ou previsÃ£o no momento</p>
          <p className="text-sm mt-2">Seus estoques estÃ£o em boas condiÃ§Ãµes!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaBell className="text-red-600" />
            Alertas de Estoque ({alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Insights e TendÃªncias */}
      {trends.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-purple-600" />
            Insights de NegÃ³cio ({trends.length})
          </h3>
          <div className="space-y-3">
            {trends.map((trend, index) => (
              <AlertCard key={index} alert={trend} />
            ))}
          </div>
        </div>
      )}

      {/* PrevisÃµes */}
      {predictiveData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaClock className="text-yellow-600" />
            PrevisÃµes de Consumo ({predictiveData.length})
          </h3>
          <div className="space-y-3">
            {predictiveData.map((prediction, index) => (
              <AlertCard key={index} alert={prediction} />
            ))}
          </div>
        </div>
      )}

      {/* Resumo de RecomendaÃ§Ãµes */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <FaInfoCircle className="text-blue-600" />
          Resumo de AÃ§Ãµes Recomendadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationTriangle className="text-red-600" />
              <span className="font-medium text-gray-900 dark:text-white">ReposiÃ§Ã£o Urgente</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {alerts.filter(a => a.priority === 'high').length} produtos necessitam reposiÃ§Ã£o imediata
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FaArrowDown className="text-orange-600" />
              <span className="font-medium text-gray-900 dark:text-white">Estoque Baixo</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {alerts.filter(a => a.priority === 'medium').length} produtos com estoque baixo
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FaChartLine className="text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-white">Oportunidades</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {trends.length} insights para otimizaÃ§Ã£o de estoque
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAlerts;
