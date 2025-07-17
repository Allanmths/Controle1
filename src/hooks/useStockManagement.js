import { useState, useMemo } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import useFirestore from './useFirestore';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';

/**
 * Hook customizado para gerenciar toda a lógica da página de estoque.
 * Encapsula o carregamento de dados, filtros, paginação, e o estado dos modais.
 */
export const useStockManagement = () => {
  // 1. Carregamento de Dados
  const { docs: products, loading: productsLoading, error: productsError } = useFirestore('products');
  const { docs: categories, loading: categoriesLoading, error: categoriesError } = useFirestore('categories');
  const { docs: locations, loading: locationsLoading, error: locationsError } = useFirestore('locations');

  // 2. Estado dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // 3. Estado de Filtros e Paginação
  const { itemsPerPage } = useSettings(); // Consome do contexto
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 4. Lógica de Negócio

  // Combina os estados de loading
  const isLoading = productsLoading || categoriesLoading || locationsLoading;

  // Combina os erros de forma mais descritiva
  const combinedError = useMemo(() => {
    const errorMessages = [];
    if (productsError) errorMessages.push(`Erro ao carregar produtos: ${productsError.message}`);
    if (categoriesError) errorMessages.push(`Erro ao carregar categorias: ${categoriesError.message}`);
    if (locationsError) errorMessages.push(`Erro ao carregar locais: ${locationsError.message}`);
    
    if (errorMessages.length === 0) return null;
    // Retorna um objeto de erro para consistência, em vez de apenas uma string.
    return new Error(errorMessages.join('; '));
  }, [productsError, categoriesError, locationsError]);

  // Memoiza os produtos filtrados para evitar recálculos desnecessários
  const filteredProducts = useMemo(() => {
    return (products || []).filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === '' || product.category === categoryFilter) &&
      (locationFilter === '' || product.location === locationFilter)
    );
  }, [products, searchTerm, categoryFilter, locationFilter]);

  // Memoiza os produtos para a página atual
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // 5. Funções de Manipulação de Eventos (Handlers)

  const handleOpenModal = (product = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleOpenDeleteModal = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const toastId = toast.loading('Excluindo produto...');
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      toast.success('Produto excluído com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto.', { id: toastId });
    }
  };

  // 6. Retorno do Hook
  // Expõe todos os estados e funções que a UI precisa para renderizar e interagir
  return {
    // Dados
    products: paginatedProducts,
    categories,
    locations,
    totalProducts: filteredProducts.length,

    // Estados de UI
    isLoading,
    error: combinedError,

    // Estado e Handlers do Modal de Produto
    isModalOpen,
    selectedProduct,
    handleOpenModal,
    handleCloseModal,

    // Estado e Handlers do Modal de Exclusão
    isDeleteModalOpen,
    productToDelete,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleDeleteProduct,

    // Handlers de Filtro e Paginação
    setSearchTerm,
    setCategoryFilter,
    setLocationFilter,
    setCurrentPage,
    itemsPerPage, // Vem do contexto agora
    currentPage,
  };
};
