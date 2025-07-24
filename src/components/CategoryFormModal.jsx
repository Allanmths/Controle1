import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';


export default function CategoryFormModal({ isOpen, onClose, categoryToEdit }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!categoryToEdit;

    useEffect(() => {
        if (isEditing) {
            setName(categoryToEdit.name || '');
        } else {
            setName('');
        }
        // Limpa erros quando o modal abre/fecha
        setError('');
    }, [categoryToEdit, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('O nome da categoria nã£o pode estar vazio.');
            return;
        }
        setLoading(true);
        setError('');

        const toastId = toast.loading(isEditing ? 'Atualizando categoria...' : 'Criando categoria...');

        try {
            if (isEditing) {
                const categoryRef = doc(db, 'categories', categoryToEdit.id);
                await updateDoc(categoryRef, { name: name.trim() });
                toast.success('Categoria atualizada com sucesso!', { id: toastId });
            } else {
                await addDoc(collection(db, 'categories'), { 
                    name: name.trim(),
                    createdAt: new Date()
                });
                toast.success('Categoria criada com sucesso!', { id: toastId });
            }
            setName(''); // Limpa o formulã¡rio
            onClose();
        } catch (err) {
            console.error('Error saving category:', err);
            console.error('Error details:', {
                code: err.code,
                message: err.message,
                stack: err.stack
            });
            
            let errorMessage = 'Falha ao salvar a categoria.';
            
            // Mensagens de erro mais especã­ficas
            if (err.code === 'permission-denied') {
                errorMessage = 'Vocãª nã£o tem permissã£o para salvar categorias. Verifique se estã¡ autenticado.';
            } else if (err.code === 'unavailable') {
                errorMessage = 'Serviã§o temporariamente indisponã­vel. Tente novamente.';
            } else if (err.code === 'invalid-argument') {
                errorMessage = 'Dados invã¡lidos fornecidos.';
            }
            
            setError(errorMessage);
            toast.error(errorMessage, { id: toastId });
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>}
                    
                    <div>
                        <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
                        <input 
                            type="text" 
                            id="category-name" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Eletrã´nicos"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-300">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition duration-300">
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
