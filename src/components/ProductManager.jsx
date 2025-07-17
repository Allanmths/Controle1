import React, { useState } from 'react';
import ProductModal from './ProductModal';
import { FaPlus } from 'react-icons/fa';
import useFirestore from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';

const ProductManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { docs: locations } = useFirestore('locations');
    const { userData } = useAuth();

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Cadastro de Produtos</h3>
                    <button 
                        onClick={() => setIsModalOpen(true)}
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
                onClose={() => setIsModalOpen(false)} 
                productToEdit={null}
                locations={locations}
                userData={userData}
            />
        </>
    );
};

export default ProductManager;
