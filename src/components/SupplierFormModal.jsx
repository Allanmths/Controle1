import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import Modal from './Modal';

const INITIAL_STATE = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
};

export default function SupplierFormModal({ isOpen, onClose, supplierToEdit }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!supplierToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    name: supplierToEdit.name || '',
                    contactPerson: supplierToEdit.contactPerson || '',
                    phone: supplierToEdit.phone || '',
                    email: supplierToEdit.email || '',
                });
            } else {
                setFormData(INITIAL_STATE);
            }
            setError('');
        }
    }, [supplierToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('O nome e o e-mail do fornecedor sÃ£o obrigatÃ³rios.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            if (isEditing) {
                const supplierRef = doc(db, 'suppliers', supplierToEdit.id);
                await updateDoc(supplierRef, formData);
            } else {
                await addDoc(collection(db, 'suppliers'), formData);
            }
            onClose();
        } catch (err) {
            console.error('Error saving supplier:', err);
            setError('Falha ao salvar o fornecedor. Tente novamente.');
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>}
                
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Fornecedor</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Pessoa de Contato (Opcional)</label>
                    <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone (Opcional)</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {loading ? 'Salvando...' : 'Salvar Fornecedor'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
