import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function LocationFormModal({ isOpen, onClose, locationToEdit }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!locationToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setName(locationToEdit.name || '');
            } else {
                setName('');
            }
            setError('');
        }
    }, [locationToEdit, isOpen, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('O nome da localidade não pode estar vazio.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            if (isEditing) {
                const locationRef = doc(db, 'locations', locationToEdit.id);
                await updateDoc(locationRef, { name });
                toast.success('Localidade atualizada com sucesso!');
            } else {
                await addDoc(collection(db, 'locations'), { name });
                toast.success('Localidade adicionada com sucesso!');
            }
            onClose();
        } catch (err) {
            console.error('Error saving location:', err);
            const errorMessage = `Falha ao salvar: ${err.message}`;
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Localidade' : 'Adicionar Nova Localidade'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>}
                    
                    <div>
                        <label htmlFor="location-name" className="block text-sm font-medium text-gray-700">Nome da Localidade</label>
                        <input 
                            type="text" 
                            id="location-name" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Armazém Principal"
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
