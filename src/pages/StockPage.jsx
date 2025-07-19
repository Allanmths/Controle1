import React, { useEffect, useRef, useState } from 'react';
import { FaPlus, FaSearch, FaFilePdf, FaEllipsisV, FaSave, FaFilter, FaTimes } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useStockManagement } from '../hooks/useStockManagement';
import { useAuth } from '../context/AuthContext';
import ProductModal from '../components/ProductModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SkeletonLoader from '../components/SkeletonLoader';
import Pagination from '../components/Pagination';

const StockPage = () => {
  const { userData } = useAuth();
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  
  const {
    products,
    categories,
    locations,
    totalProducts,
    isLoading,
    isModalOpen,
    selectedProduct,
    handleOpenModal,
    handleCloseModal,
    isDeleteModalOpen,
    productToDelete,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleDeleteProduct,
    searchTerm, 
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    locationFilter,
    setLocationFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
  } = useStockManagement();

  // Estado local apenas para o dropdown de ações
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stock-saved-filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Salvar filtro atual
  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    
    const newFilter = {
      id: Date.now(),
      name: filterName,
      searchTerm,
      categoryFilter,
      locationFilter,
      createdAt: new Date().toISOString()
    };
    
    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    localStorage.setItem('stock-saved-filters', JSON.stringify(updatedFilters));
    setFilterName('');
    setShowSaveFilter(false);
  };

  // Aplicar filtro salvo
  const applyFilter = (filter) => {
    setSearchTerm(filter.searchTerm);
    setCategoryFilter(filter.categoryFilter);
    setLocationFilter(filter.locationFilter);
  };

  // Remover filtro salvo
  const removeFilter = (filterId) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);
    localStorage.setItem('stock-saved-filters', JSON.stringify(updatedFilters));
  };

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setLocationFilter('');
  };  const generatePdf = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Estoque', 20, 10);
    // Nota: O hook retorna os produtos já paginados.
    // Para gerar um PDF com todos os itens filtrados, o hook precisaria ser ajustado para expor essa lista completa.
    // Por simplicidade, o PDF será gerado com os itens visíveis na página atual.
    doc.autoTable({
      head: [['Nome', 'Categoria', 'Local', 'Quantidade', 'Preço']],
      body: (products || []).map(p => [p.name, p.category, p.location, p.quantity, `R$ ${p.price}`]),
    });
    doc.save('relatorio_estoque.pdf');
  };

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        <div className="flex items-center space-x-2">
          <button onClick={generatePdf} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center">
            <FaFilePdf className="mr-2" />
            Exportar PDF
          </button>
          {/* Botão de Adicionar Produto removido - agora está disponível apenas na aba Cadastros */}
        </div>
      </div>

      {/* Filtros Avançados */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4" data-tour="stock-filters">
        {/* Filtros Salvos */}
        {savedFilters.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filtros Salvos</h3>
              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Limpar filtros
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(filter => (
                <div key={filter.id} className="flex items-center bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  <button
                    onClick={() => applyFilter(filter)}
                    className="hover:underline mr-2"
                  >
                    {filter.name}
                  </button>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome..."
              className="w-full p-3 border rounded-lg pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          
          <select
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {categories?.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          
          <select
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">Todos os Locais</option>
            {locations?.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
          </select>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveFilter(true)}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Salvar filtros atuais"
            >
              <FaSave className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Salvar</span>
            </button>
          </div>
        </div>

        {/* Modal para salvar filtro */}
        {showSaveFilter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Salvar Filtro</h3>
              <input
                type="text"
                placeholder="Nome do filtro..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && saveCurrentFilter()}
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveFilter(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCurrentFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!filterName.trim()}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <SkeletonLoader rows={5} />
          ) : products.length > 0 ? (
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoria</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Local</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantidade</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preço</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products && products.length > 0 ? (
                  products.map(product => {
                    // Encontrar nome da categoria pelo ID
                    const category = categories?.find(cat => cat.id === product.categoryId);
                    const categoryName = category ? category.name : 'N/A';
                    
                    // Calcular quantidade total de todas as localizações
                    const totalQuantity = Object.values(product.locations || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                    
                    // Formatar locais onde tem estoque
                    const stockLocations = Object.entries(product.locations || {})
                      .filter(([_, qty]) => Number(qty) > 0)
                      .map(([locationId, qty]) => {
                        const location = locations?.find(loc => loc.id === locationId);
                        return location ? `${location.name} (${qty})` : `${locationId} (${qty})`;
                      })
                      .join(', ') || 'Sem estoque';
                    
                    return (
                      <tr key={product.id}>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{product.name}</td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{categoryName}</td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{stockLocations}</td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{totalQuantity} {product.unit || 'un'}</td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">R$ {(product.cost || 0).toFixed(2)}</td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm relative" ref={openDropdown === product.id ? dropdownRef : null}>
                          <button onClick={() => setOpenDropdown(openDropdown === product.id ? null : product.id)} className="text-gray-600 hover:text-gray-900">
                            <FaEllipsisV />
                          </button>
                          {openDropdown === product.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                              <a href="#" onClick={(e) => { e.preventDefault(); handleOpenModal(product); setOpenDropdown(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar</a>
                              <a href="#" onClick={(e) => { e.preventDefault(); handleOpenDeleteModal(product); setOpenDropdown(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Excluir</a>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">Carregando produtos...</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-10">
              <h2 className="text-xl font-semibold mb-2">Nenhum produto encontrado.</h2>
              <p className="text-gray-500 mb-4">Vá para a aba "Cadastros" para adicionar produtos.</p>
              {/* Botão removido - cadastro agora é apenas na aba Cadastros */}
            </div>
          )}
        </div>
      </div>

      {/* Paginação */}
      {products.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalProducts}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modais */}
      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          productToEdit={selectedProduct}
          locations={locations}
          userData={userData}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={async () => {
          await handleDeleteProduct();
          handleCloseDeleteModal();
        }}
        productName={productToDelete?.name}
      />
    </div>
  );
};

export default StockPage;
