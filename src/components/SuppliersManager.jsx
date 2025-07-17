import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import SupplierFormModal from './SupplierFormModal';

export default function SuppliersManager() {
    const { userData } = useAuth();
    const { docs: suppliers, loading } = useFirestore('suppliers');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState(null);

    const canEdit = userData?.role === 'admin' || userData?.role === 'editor';

    const handleOpenModal = (supplier = null) => {
        setSupplierToEdit(supplier);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSupplierToEdit(null);
        setIsModalOpen(false);
    };

    const handleDeleteSupplier = async (supplierId) => {
        if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
            const promise = deleteDoc(doc(db, 'suppliers', supplierId));
            toast.promise(promise, {
                loading: 'Excluindo fornecedor...',
                success: 'Fornecedor excluído com sucesso!',
                error: 'Falha ao excluir o fornecedor.',
            });
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Gerenciar Fornecedores</h3>
                    {canEdit && (
                        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                            <i className="fas fa-plus mr-2"></i>
                            Novo Fornecedor
                        </button>
                    )}
                </div>
                
                {loading ? (
                    <p className="text-center text-gray-500 py-4">Carregando fornecedores...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                                    {canEdit && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {suppliers && suppliers.length > 0 ? suppliers.map(sup => (
                                    <tr key={sup.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{sup.name}</div>
                                            <div className="text-sm text-gray-500">{sup.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sup.contactPerson || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sup.phone || '-'}</td>
                                        {canEdit && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => handleOpenModal(sup)} className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                                                <button onClick={() => handleDeleteSupplier(sup.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={canEdit ? "4" : "3"} className="text-center text-gray-500 py-4">Nenhum fornecedor cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {canEdit && (
                <SupplierFormModal 
                    isOpen={isModalOpen} 
                    onClose={handleCloseModal} 
                    supplierToEdit={supplierToEdit} 
                />
            )}
        </>
    );
}
