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
    
    // Ativar notificações automáticas
    useAutoNotifications();

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Cadastro de Produtos</h3>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        <FaPlus className="mr-2" />
                        Adicionar Produto
                    </button>
                </div>
                <p className="text-gray-600">
                    Clique no botão para adicionar um novo item ao seu inventário. Você poderá definir nome, categoria, estoque mínimo e as quantidades em cada local de armazenamento.
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
