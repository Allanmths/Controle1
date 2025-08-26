import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaCalendarAlt, 
  FaSearch, 
  FaFilter, 
  FaDownload,
  FaChartLine,
  FaExclamationTriangle,
  FaExchangeAlt,
  FaHistory,
  FaSpinner,
  FaBoxes,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import useFirestore from '../hooks/useFirestore';
import { format, subDays, isSameDay, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const HistoricalStockAnalysis = () => {
  const { docs: products } = useFirestore('products');
  const { docs: categories } = useFirestore('categories');
  const { docs: locations } = useFirestore('locations');
  const { docs: movements, loading: movementsLoading } = useFirestore('movements', { field: 'timestamp', direction: 'desc' });

  // Estados do componente
  const [selectedDate, setSelectedDate] = useState('');
  const [comparisonDate, setComparisonDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Configurar data padrão (última semana)
  useEffect(() => {
    if (!selectedDate) {
      const weekAgo = subDays(new Date(), 7);
      setSelectedDate(format(weekAgo, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  // Função para calcular estoque em uma data específica
  const calculateStockAtDate = useMemo(() => {
    return (targetDate) => {
      if (!movements || !products || !targetDate) return [];

      setIsAnalyzing(true);
      
      const targetDateTime = new Date(targetDate + 'T23:59:59');
      const stockAtDate = {};

      // Inicializar estoque atual de todos os produtos
      products.forEach(product => {
        stockAtDate[product.id] = {
          product,
          locations: { ...product.locations } || {}
        };
      });

      // Filtrar movimentações até a data alvo
      const relevantMovements = movements.filter(movement => {
        const movementDate = new Date(movement.timestamp?.toDate?.() || movement.timestamp);
        return isAfter(movementDate, targetDateTime);
      });

      // Reverter movimentações (do mais recente para o mais antigo)
      relevantMovements.sort((a, b) => {
        const dateA = new Date(a.timestamp?.toDate?.() || a.timestamp);
        const dateB = new Date(b.timestamp?.toDate?.() || b.timestamp);
        return dateB - dateA;
      });

      // Aplicar reversão das movimentações
      relevantMovements.forEach(movement => {
        const productId = movement.productId;
        
        if (!stockAtDate[productId]) return;

        if (movement.type === 'transfer') {
          // Reverter transferência
          const fromLocationId = movement.fromLocationId;
          const toLocationId = movement.toLocationId;
          const quantity = movement.quantity;

          // Reverter: origem recebe de volta, destino perde
          if (fromLocationId) {
            stockAtDate[productId].locations[fromLocationId] = 
              (stockAtDate[productId].locations[fromLocationId] || 0) + quantity;
          }
          if (toLocationId) {
            stockAtDate[productId].locations[toLocationId] = 
              Math.max(0, (stockAtDate[productId].locations[toLocationId] || 0) - quantity);
          }
        } else if (movement.type === 'exit' || movement.type === 'saida') {
          // Reverter saída (produto volta ao estoque)
          const locationId = movement.locationId;
          const quantity = movement.quantity;

          if (locationId) {
            stockAtDate[productId].locations[locationId] = 
              (stockAtDate[productId].locations[locationId] || 0) + quantity;
          }
        } else if (movement.type === 'entry' || movement.type === 'entrada') {
          // Reverter entrada (produto sai do estoque)
          const locationId = movement.locationId;
          const quantity = movement.quantity;

          if (locationId) {
            stockAtDate[productId].locations[locationId] = 
              Math.max(0, (stockAtDate[productId].locations[locationId] || 0) - quantity);
          }
        }
      });

      setIsAnalyzing(false);
      return Object.values(stockAtDate);
    };
  }, [movements, products]);

  // Calcular estoque na data selecionada
  const historicalStock = useMemo(() => {
    if (!selectedDate) return [];
    return calculateStockAtDate(selectedDate);
  }, [selectedDate, calculateStockAtDate]);

  // Calcular estoque na data de comparação
  const comparisonStock = useMemo(() => {
    if (!comparisonDate || !showComparison) return [];
    return calculateStockAtDate(comparisonDate);
  }, [comparisonDate, showComparison, calculateStockAtDate]);

  // Função para obter nome da categoria
  const getCategoryName = (categoryId) => {
    if (!categories) return 'Sem categoria';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  // Função para obter nome da localização
  const getLocationName = (locationId) => {
    if (!locations) return 'Local desconhecido';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Local desconhecido';
  };

  // Calcular totais do estoque histórico
  const historicalTotals = useMemo(() => {
    if (!historicalStock.length) return { totalProducts: 0, totalQuantity: 0, totalValue: 0 };

    const totalProducts = historicalStock.length;
    const totalQuantity = historicalStock.reduce((sum, item) => 
      sum + Object.values(item.locations || {}).reduce((s, q) => s + (q || 0), 0), 0
    );
    const totalValue = historicalStock.reduce((sum, item) => 
      sum + Object.values(item.locations || {}).reduce((s, q) => s + ((q || 0) * (item.product.price || 0)), 0), 0
    );

    return { totalProducts, totalQuantity, totalValue };
  }, [historicalStock]);

  // Processar dados filtrados para exibição
  const processedData = useMemo(() => {
    let filtered = [...historicalStock];

    // Aplicar filtros
    if (selectedCategory) {
      filtered = filtered.filter(item => item.product.categoryId === selectedCategory);
    }

    if (selectedLocation) {
      filtered = filtered.filter(item => 
        item.locations && item.locations[selectedLocation] && item.locations[selectedLocation] > 0
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Processar dados para tabela
    const tableData = [];
    
    filtered.forEach(item => {
      const product = item.product;
      const locations = item.locations || {};
      
      if (selectedLocation) {
        // Mostrar apenas a localização selecionada
        const quantity = locations[selectedLocation] || 0;
        if (quantity > 0 || searchTerm) {
          tableData.push({
            id: `${product.id}-${selectedLocation}`,
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            category: getCategoryName(product.categoryId),
            location: getLocationName(selectedLocation),
            locationId: selectedLocation,
            quantity: quantity,
            price: product.price || 0,
            value: quantity * (product.price || 0),
            minStock: product.minStock || 0,
            currentQuantity: Object.values(product.locations || {}).reduce((s, q) => s + (q || 0), 0)
          });
        }
      } else {
        // Mostrar todas as localizações
        Object.entries(locations).forEach(([locationId, quantity]) => {
          if (quantity > 0 || searchTerm) {
            tableData.push({
              id: `${product.id}-${locationId}`,
              productId: product.id,
              productName: product.name,
              productCode: product.code,
              category: getCategoryName(product.categoryId),
              location: getLocationName(locationId),
              locationId: locationId,
              quantity: quantity || 0,
              price: product.price || 0,
              value: (quantity || 0) * (product.price || 0),
              minStock: product.minStock || 0,
              currentQuantity: Object.values(product.locations || {}).reduce((s, q) => s + (q || 0), 0)
            });
          }
        });
      }
    });

    return tableData.sort((a, b) => a.productName.localeCompare(b.productName));
  }, [historicalStock, selectedCategory, selectedLocation, searchTerm, locations, categories]);

  // Calcular diferenças se comparação estiver ativa
  const differences = useMemo(() => {
    if (!showComparison || !comparisonStock.length) return [];

    const diffs = [];
    
    historicalStock.forEach(currentItem => {
      const comparisonItem = comparisonStock.find(c => c.product.id === currentItem.product.id);
      
      if (comparisonItem) {
        const currentTotal = Object.values(currentItem.locations || {}).reduce((s, q) => s + (q || 0), 0);
        const comparisonTotal = Object.values(comparisonItem.locations || {}).reduce((s, q) => s + (q || 0), 0);
        const difference = currentTotal - comparisonTotal;
        
        if (difference !== 0) {
          diffs.push({
            productId: currentItem.product.id,
            productName: currentItem.product.name,
            category: getCategoryName(currentItem.product.categoryId),
            dateAQuantity: currentTotal,
            dateBQuantity: comparisonTotal,
            difference: difference,
            percentageChange: comparisonTotal > 0 ? ((difference / comparisonTotal) * 100) : 0,
            isIncrease: difference > 0,
            currentQuantity: Object.values(currentItem.product.locations || {}).reduce((s, q) => s + (q || 0), 0)
          });
        }
      }
    });

    return diffs.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [historicalStock, comparisonStock, showComparison, categories]);

  // Exportar relatório para PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(16);
      doc.text('Análise Histórica de Estoque', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Data de Análise: ${format(new Date(selectedDate), "dd/MM/yyyy", { locale: ptBR })}`, 14, 30);
      
      if (showComparison && comparisonDate) {
        doc.text(`Data de Comparação: ${format(new Date(comparisonDate), "dd/MM/yyyy", { locale: ptBR })}`, 14, 38);
      }
      
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 46);

      let startY = 60;

      // Resumo
      doc.setFontSize(14);
      doc.text('Resumo do Estoque:', 14, startY);
      startY += 10;

      doc.setFontSize(11);
      doc.text(`Total de Produtos: ${historicalTotals.totalProducts}`, 14, startY);
      doc.text(`Quantidade Total: ${historicalTotals.totalQuantity}`, 14, startY + 8);
      doc.text(`Valor Total: R$ ${historicalTotals.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, startY + 16);
      
      startY += 30;

      // Tabela de produtos
      const headers = [['Produto', 'Categoria', 'Local', 'Qtd', 'Atual', 'Dif.']];
      const data = processedData.map(item => [
        item.productName,
        item.category,
        item.location,
        item.quantity.toString(),
        item.currentQuantity.toString(),
        (item.currentQuantity - item.quantity).toString()
      ]);

      doc.autoTable({
        startY: startY,
        head: headers,
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 }
      });

      // Diferenças se comparação estiver ativa
      if (showComparison && differences.length > 0) {
        const finalY = doc.autoTable.previous.finalY + 20;
        
        doc.setFontSize(14);
        doc.text('Principais Mudanças:', 14, finalY);
        
        const diffHeaders = [['Produto', 'Data A', 'Data B', 'Diferença', '%']];
        const diffData = differences.slice(0, 10).map(diff => [
          diff.productName,
          diff.dateAQuantity.toString(),
          diff.dateBQuantity.toString(),
          (diff.isIncrease ? '+' : '') + diff.difference.toString(),
          (diff.isIncrease ? '+' : '') + diff.percentageChange.toFixed(1) + '%'
        ]);

        doc.autoTable({
          startY: finalY + 10,
          head: diffHeaders,
          body: diffData,
          theme: 'striped',
          headStyles: { fillColor: [46, 125, 50] },
          styles: { fontSize: 8 }
        });
      }

      const fileName = `analise_historica_estoque_${format(new Date(selectedDate), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setSearchTerm('');
  };

  if (movementsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-blue-500 text-2xl mr-3" />
        <span className="text-gray-600">Carregando dados históricos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaHistory className="mr-3 text-blue-500" />
              Análise Histórica de Estoque
            </h2>
            <p className="text-gray-600 mt-1">
              Visualize como estava seu estoque em datas específicas e identifique mudanças
            </p>
          </div>
          
          <button
            onClick={exportToPDF}
            disabled={!selectedDate || processedData.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaDownload />
            <span>Exportar PDF</span>
          </button>
        </div>

        {/* Seleção de datas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data para Análise *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 mb-1">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Comparar com outra data</span>
            </label>
            <input
              type="date"
              value={comparisonDate}
              onChange={(e) => setComparisonDate(e.target.value)}
              disabled={!showComparison}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div className="flex items-end">
            {isAnalyzing && (
              <div className="flex items-center text-blue-600">
                <FaSpinner className="animate-spin mr-2" />
                <span className="text-sm">Calculando...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {selectedDate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <FaBoxes className="text-blue-600 text-2xl mr-3" />
              <div>
                <p className="text-sm text-blue-600">Produtos com Estoque</p>
                <p className="text-2xl font-bold text-blue-800">{historicalTotals.totalProducts}</p>
                <p className="text-xs text-blue-500">
                  em {format(new Date(selectedDate), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <FaChartLine className="text-green-600 text-2xl mr-3" />
              <div>
                <p className="text-sm text-green-600">Quantidade Total</p>
                <p className="text-2xl font-bold text-green-800">{historicalTotals.totalQuantity}</p>
                <p className="text-xs text-green-500">unidades no período</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <FaCalendarAlt className="text-purple-600 text-2xl mr-3" />
              <div>
                <p className="text-sm text-purple-600">Valor do Estoque</p>
                <p className="text-2xl font-bold text-purple-800">
                  R$ {historicalTotals.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-purple-500">valor total estimado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparação de Mudanças */}
      {showComparison && differences.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaExchangeAlt className="mr-2 text-orange-500" />
            Principais Mudanças
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {format(new Date(selectedDate), "dd/MM", { locale: ptBR })}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {format(new Date(comparisonDate), "dd/MM", { locale: ptBR })}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Diferença</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {differences.slice(0, 10).map((diff, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{diff.productName}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{diff.dateAQuantity}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{diff.dateBQuantity}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`flex items-center justify-center ${
                        diff.isIncrease ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {diff.isIncrease ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                        {diff.isIncrease ? '+' : ''}{diff.difference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                      {diff.currentQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categories?.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as localizações</option>
            {locations?.map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <FaFilter />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* Tabela de resultados */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Estoque em {format(new Date(selectedDate), "dd/MM/yyyy", { locale: ptBR })} ({processedData.length} itens)
            </h3>
          </div>

          {processedData.length === 0 ? (
            <div className="text-center py-12">
              <FaExclamationTriangle className="mx-auto text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500">
                Não há dados de estoque para a data e filtros selecionados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd. Histórica
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd. Atual
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diferença
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Histórico
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.map((item) => {
                    const difference = item.currentQuantity - item.quantity;
                    const isIncrease = difference > 0;
                    const hasChanged = difference !== 0;

                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 ${hasChanged ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            {item.productCode && (
                              <div className="text-sm text-gray-500">#{item.productCode}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {item.currentQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {hasChanged ? (
                            <span className={`flex items-center justify-center ${
                              isIncrease ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isIncrease ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                              {isIncrease ? '+' : ''}{difference}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricalStockAnalysis;
