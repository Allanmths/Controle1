import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data, filename = 'lista_compras') => {
  try {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Preparar dados para a planilha
    const worksheetData = [];
    
    // CabeÃ§alho
    worksheetData.push([
      'Lista de Compras',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    worksheetData.push([
      'TÃ­tulo:',
      data.title,
      '',
      'Data:',
      new Date(data.createdAt).toLocaleDateString(),
      ''
    ]);
    
    worksheetData.push([
      'Criado por:',
      data.createdByName,
      '',
      'Status:',
      data.status,
      ''
    ]);
    
    worksheetData.push(['']); // Linha vazia
    
    // Resumo
    worksheetData.push(['RESUMO']);
    worksheetData.push([
      'Total de Itens:',
      data.summary?.totalItems || 0,
      '',
      'Custo Total:',
      `R$ ${(data.summary?.totalCost || 0).toFixed(2)}`,
      ''
    ]);
    
    worksheetData.push([
      'Itens CrÃ­ticos:',
      data.summary?.criticalItems || 0,
      '',
      'Fornecedores:',
      data.summary?.suppliers || 0,
      ''
    ]);
    
    worksheetData.push(['']); // Linha vazia
    
    // CabeÃ§alhos dos itens
    worksheetData.push([
      'Produto',
      'Fornecedor',
      'Estoque Atual',
      'Qtd. Sugerida',
      'PreÃ§o Unit.',
      'Total',
      'Prioridade'
    ]);
    
    // Itens
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        worksheetData.push([
          item.productName,
          item.supplierName || 'Sem fornecedor',
          item.currentStock,
          item.suggestedQuantity,
          `R$ ${(item.unitCost || 0).toFixed(2)}`,
          `R$ ${(item.totalCost || 0).toFixed(2)}`,
          item.priority === 'critical' ? 'CrÃ­tico' :
          item.priority === 'high' ? 'Alto' :
          item.priority === 'medium' ? 'MÃ©dio' : 'Baixo'
        ]);
      });
    }
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // EstilizaÃ§Ã£o
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Largura das colunas
    ws['!cols'] = [
      { width: 30 }, // Produto
      { width: 20 }, // Fornecedor
      { width: 15 }, // Estoque Atual
      { width: 15 }, // Qtd. Sugerida
      { width: 15 }, // PreÃ§o Unit.
      { width: 15 }, // Total
      { width: 15 }  // Prioridade
    ];
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Compras');
    
    // Salvar arquivo
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw error;
  }
};

export const exportToPDF = (data, filename = 'lista_compras') => {
  try {
    const doc = new jsPDF();
    
    // TÃ­tulo
    doc.setFontSize(20);
    doc.text('Lista de Compras', 20, 20);
    
    // InformaÃ§Ãµes bÃ¡sicas
    doc.setFontSize(12);
    doc.text(`TÃ­tulo: ${data.title}`, 20, 35);
    doc.text(`Data: ${new Date(data.createdAt).toLocaleDateString()}`, 20, 45);
    doc.text(`Criado por: ${data.createdByName}`, 20, 55);
    doc.text(`Status: ${data.status}`, 20, 65);
    
    // Resumo
    doc.setFontSize(14);
    doc.text('Resumo:', 20, 80);
    
    doc.setFontSize(10);
    doc.text(`Total de Itens: ${data.summary?.totalItems || 0}`, 20, 90);
    doc.text(`Itens CrÃ­ticos: ${data.summary?.criticalItems || 0}`, 20, 100);
    doc.text(`Custo Total: R$ ${(data.summary?.totalCost || 0).toFixed(2)}`, 20, 110);
    doc.text(`Fornecedores: ${data.summary?.suppliers || 0}`, 20, 120);
    
    // Tabela de itens
    if (data.items && data.items.length > 0) {
      const tableData = data.items.map(item => [
        item.productName,
        item.supplierName || 'Sem fornecedor',
        item.currentStock.toString(),
        item.suggestedQuantity.toString(),
        `R$ ${(item.unitCost || 0).toFixed(2)}`,
        `R$ ${(item.totalCost || 0).toFixed(2)}`,
        item.priority === 'critical' ? 'CrÃ­tico' :
        item.priority === 'high' ? 'Alto' :
        item.priority === 'medium' ? 'MÃ©dio' : 'Baixo'
      ]);
      
      doc.autoTable({
        head: [['Produto', 'Fornecedor', 'Estoque', 'Qtd.', 'PreÃ§o', 'Total', 'Prioridade']],
        body: tableData,
        startY: 135,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Produto
          1: { cellWidth: 30 }, // Fornecedor
          2: { cellWidth: 20 }, // Estoque
          3: { cellWidth: 20 }, // Quantidade
          4: { cellWidth: 25 }, // PreÃ§o
          5: { cellWidth: 25 }, // Total
          6: { cellWidth: 25 }  // Prioridade
        }
      });
    }
    
    // RodapÃ©
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `PÃ¡gina ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString()}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Salvar arquivo
    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${timestamp}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw error;
  }
};

export const exportToCSV = (data, filename = 'lista_compras') => {
  try {
    const csvData = [];
    
    // CabeÃ§alho
    csvData.push([
      'Produto',
      'Fornecedor',
      'Estoque Atual',
      'Quantidade Sugerida',
      'PreÃ§o UnitÃ¡rio',
      'Total',
      'Prioridade'
    ]);
    
    // Itens
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        csvData.push([
          item.productName,
          item.supplierName || 'Sem fornecedor',
          item.currentStock,
          item.suggestedQuantity,
          (item.unitCost || 0).toFixed(2),
          (item.totalCost || 0).toFixed(2),
          item.priority === 'critical' ? 'CrÃ­tico' :
          item.priority === 'high' ? 'Alto' :
          item.priority === 'medium' ? 'MÃ©dio' : 'Baixo'
        ]);
      });
    }
    
    // Converter para CSV
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    // Criar blob e download
    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para CSV:', error);
    throw error;
  }
};
