import React, { useState } from 'react';
import useFirestore from '../hooks/useFirestore';
import SkeletonLoader from './SkeletonLoader';
import { db } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LocationFormModal from './LocationFormModal';

const LocationManager = () => {
    const { docs: locations, loading } = useFirestore('locations', { field: 'name', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [locationToEdit, setLocationToEdit] = useState(null);

    const handleOpenModal = (location = null) => {
        setLocationToEdit(location);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setLocationToEdit(null);
        setIsModalOpen(false);
    };

    const handleDeleteLocation = async (locationId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta localidade? Esta ação não pode ser desfeita.')) return;

        const locationRef = doc(db, 'locations', locationId);
        const promise = deleteDoc(locationRef);
        
        toast.promise(promise, {
            loading: 'Excluindo localidade...',
            success: 'Localidade excluída com sucesso!',
            error: (err) => `Falha ao excluir: ${err.message}`,
        });
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Cadastro de Localidades</h3>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        <FaPlus className="mr-2" />
                        Nova Localidade
                    </button>
                </div>

                <div className="mt-4">
                    {loading ? (
                        <SkeletonLoader count={3} />
                    ) : (
                        <ul className="space-y-3">
                            {locations && locations.length > 0 ? (
                                locations.map((location) => (
                                    <li key={location.id} className="flex items-center justify-between p-3 even:bg-gray-50 rounded-md">
                                        <span className="text-gray-800 font-medium">{location.name}</span>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleOpenModal(location)} className="text-blue-500 hover:text-blue-700 transition-colors">
                                                <FaEdit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteLocation(location.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Nenhuma localidade encontrada.</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            <LocationFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                locationToEdit={locationToEdit} 
            />
        </>
    );
};

export default LocationManager;
