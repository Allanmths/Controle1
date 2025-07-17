import React from 'react';
import UserRoleManager from '../components/UserRoleManager';
import { useSettings } from '../context/SettingsContext';
import { FaListOl } from 'react-icons/fa';

const SettingsPage = () => {
    const { itemsPerPage, setItemsPerPage } = useSettings();

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h2>
            
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Card de Paginação */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <FaListOl className="text-2xl text-blue-500 mr-3" />
                        <h3 className="text-xl font-bold text-gray-800">Visualização de Listas</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Defina quantos itens devem ser exibidos por página nas tabelas do sistema.</p>
                    
                    <div>
                        <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700">Itens por página</label>
                        <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="mt-1 block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>

                {/* Card de Usuários (existente) */}
                <UserRoleManager />
            </div>
        </div>
    );
};

export default SettingsPage;
