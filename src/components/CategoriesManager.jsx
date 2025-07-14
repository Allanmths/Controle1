import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import CategoryFormModal from './CategoryFormModal';
import SkeletonLoader from './SkeletonLoader';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

export default function CategoriesManager() {
    const { currentUser, userData } = useAuth();
    const { docs: categories, loading } = useFirestore('categories', { field: 'name', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    // Permite edição para usuários autenticados (pode ser ajustado conforme necessário)
    const canEdit = currentUser && (userData?.role === 'admin' || userData?.role === 'editor' || !userData?.role);

    const handleOpenModal = (category = null) => {
        setCategoryToEdit(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCategoryToEdit(null);
        setIsModalOpen(false);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            const promise = deleteDoc(doc(db, 'categories', categoryId));
            toast.promise(promise, {
                loading: 'Excluindo categoria...',
                success: 'Categoria excluída com sucesso!',
                error: 'Falha ao excluir a categoria.',
            });
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Cadastro de Categorias</h3>
                    {canEdit && (
                        <button 
                            onClick={() => handleOpenModal()} 
                            className="flex items-center bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                            <FaPlus className="mr-2" />
                            Nova Categoria
                        </button>
                    )}
                </div>
                
                <div className="mt-4">
                    {loading ? (
                        <SkeletonLoader count={3} />
                    ) : (
                        <ul className="space-y-3">
                            {categories.length > 0 ? (
                                categories.map((cat) => (
                                    <li key={cat.id} className="flex items-center justify-between p-3 even:bg-gray-50 rounded-md">
                                        <span className="text-gray-800 font-medium">{cat.name}</span>
                                        {canEdit && (
                                            <div className="flex gap-3">
                                                <button onClick={() => handleOpenModal(cat)} className="text-blue-500 hover:text-blue-700 transition-colors">
                                                    <FaEdit size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Nenhuma categoria encontrada.</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {canEdit && (
                <CategoryFormModal 
                    isOpen={isModalOpen} 
                    onClose={handleCloseModal} 
                    categoryToEdit={categoryToEdit} 
                />
            )}
        </>
    );
}
