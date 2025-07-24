import React from 'react';
import ProductModal from './ProductModal';
import { FaPlus } from 'react-icons/fa';
import { useStockManagement } from '../hooks/useStockManagement';
import { useAuth } from '../context/AuthContext';
import { useAutoNotifications } from '../hooks/useNotificationHelpers';

const ProductManager = () => {
    const { userData } = useAuth();
    const {
        locations,
        isModalOpen,
        selectedProduct,
        handleOpenModal,
        handleCloseModal,
    } = useStockManagement();
    
    // Ativar notificaã§ãµes automã¡ticas
    useAutoNotifications();

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <h3 className="text-xl font-bold text-gray-800">Cadastro de Produtos</h3>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center bg-blue-500 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-lg hover:bg-blue-600 transition duration-300 min-h-[44px] sm:min-h-[48px] text-sm sm:text-base w-full sm:w-auto"
                    >
                        <FaPlus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                        Adicionar Produto
                    </button>
                </div>
                <p className="text-gray-600">
                    Clique no botã£o para adicionar um novo item ao seu inventã¡rio. Vocãª poderã¡ definir nome, categoria, estoque mã­nimo e as quantidades em cada local de armazenamento.
                </p>
            </div>

            <ProductModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                productToEdit={selectedProduct}
                locations={locations}
                userData={userData}
            />
        </>
    );
};

export default ProductManager;
