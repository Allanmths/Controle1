﻿import { useState, useMemo } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import useFirestore from './useFirestore';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';

/**
 * Hook customizado para gerenciar toda a lÃ³gica da pÃ¡gina de estoque.
 * Encapsula o carregamento de dados, filtros, paginaÃ§Ã£o, e o estado dos modais.
 */
export const useStockManagement = () => {
  // 1. Carregamento de Dados
  const { docs: products, loading: productsLoading, error: productsError } = useFirestore('products');
  const { docs: categories, loading: categoriesLoading, error: categoriesError } = useFirestore('categories');
  const { docs: locations, loading: locationsLoading, error: locationsError } = useFirestore('locations');

  // 2. Estado dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDeleteConfirm, setProductToDeleteConfirm] = useState(null);

  // 3. Estado de Filtros e PaginaÃ§Ã£o
  const { itemsPerPage } = useSettings(); // Consome do contexto
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 4. LÃ³gica de NegÃ³cio

  // Combina os estados de loading
  const isLoading = productsLoading || categoriesLoading || locationsLoading;

  // Combina os erros de forma mais descritiva
  const combinedError = useMemo(() => {
    const errorMessages = [];
    if (productsError) errorMessages.push(`Erro ao carregar produtos: ${productsError.message}`);
    if (categoriesError) errorMessages.push(`Erro ao carregar categorias: ${categoriesError.message}`);
    if (locationsError) errorMessages.push(`Erro ao carregar locais: ${locationsError.message}`);
    
    if (errorMessages.length === 0) return null;
    // Retorna um objeto de erro para consistÃªncia, em vez de apenas uma string.
    return new Error(errorMessages.join('; '));
  }, [productsError, categoriesError, locationsError]);

  // Memoiza os produtos filtrados para evitar recÃ¡lculos desnecessÃ¡rios
  const filteredProducts = useMemo(() => {
    return (products || []).filter(product => {
      // Filtro por nome
      const matchesName = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por categoria - usando categoryId e comparando com o nome da categoria
      let matchesCategory = true;
      if (categoryFilter !== '') {
        const category = categories?.find(cat => cat.id === product.categoryId);
        matchesCategory = category ? category.name === categoryFilter : false;
      }
      
      // Filtro por localizaÃ§Ã£o - verificando se tem estoque na localizaÃ§Ã£o selecionada
      let matchesLocation = true;
      if (locationFilter !== '') {
        const location = locations?.find(loc => loc.name === locationFilter);
        if (location && product.locations) {
          const stockInLocation = Number(product.locations[location.id] || 0);
          matchesLocation = stockInLocation > 0;
        } else {
          matchesLocation = false;
        }
      }
      
      return matchesName && matchesCategory && matchesLocation;
    });
  }, [products, searchTerm, categoryFilter, locationFilter, categories, locations]);

  // Memoiza os produtos para a pÃ¡gina atual
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // 5. FunÃ§Ãµes de ManipulaÃ§Ã£o de Eventos (Handlers)

  const handleOpenEditConfirmModal = (product) => {
    setProductToEdit(product);
    setIsEditConfirmModalOpen(true);
  };

  const handleCloseEditConfirmModal = () => {
    setIsEditConfirmModalOpen(false);
    setProductToEdit(null);
  };

  const handleConfirmEdit = () => {
    setSelectedProduct(productToEdit);
    setIsModalOpen(true);
    setIsEditConfirmModalOpen(false);
    setProductToEdit(null);
  };

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

  const handleOpenDeleteConfirmModal = (product) => {
    setProductToDeleteConfirm(product);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setProductToDeleteConfirm(null);
  };

  const handleConfirmDelete = () => {
    setProductToDelete(productToDeleteConfirm);
    setIsDeleteModalOpen(true);
    setIsDeleteConfirmModalOpen(false);
    setProductToDeleteConfirm(null);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const toastId = toast.loading('Excluindo produto...');
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      toast.success('Produto excluÃ­do com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto.', { id: toastId });
    }
  };

  // 6. Retorno do Hook
  // ExpÃµe todos os estados e funÃ§Ãµes que a UI precisa para renderizar e interagir
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

    // Estado e Handlers do Modal de ConfirmaÃ§Ã£o de EdiÃ§Ã£o
    isEditConfirmModalOpen,
    productToEdit,
    handleOpenEditConfirmModal,
    handleCloseEditConfirmModal,
    handleConfirmEdit,

    // Estado e Handlers do Modal de ExclusÃ£o
    isDeleteModalOpen,
    productToDelete,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleDeleteProduct,

    // Estado e Handlers do Modal de ConfirmaÃ§Ã£o de ExclusÃ£o
    isDeleteConfirmModalOpen,
    productToDeleteConfirm,
    handleOpenDeleteConfirmModal,
    handleCloseDeleteConfirmModal,
    handleConfirmDelete,

    // Handlers de Filtro e PaginaÃ§Ã£o
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    locationFilter,
    setLocationFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage, // Vem do contexto agora
  };
};

