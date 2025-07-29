import React from 'react';
import UserRoleManager from '../components/UserRoleManager';
import { useSettings } from '../context/SettingsContext';
import { FaListOl, FaPalette, FaMoon, FaSun } from 'react-icons/fa';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const { itemsPerPage, setItemsPerPage, theme, toggleTheme } = useSettings();

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Configurações</h2>
            
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Card de Tema */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <FaPalette className="text-2xl text-purple-500 mr-3" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Aparência</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Escolha entre o tema claro ou escuro para personalizar a aparência do sistema.
                    </p>
                    
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                                theme === 'light' 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <FaSun className="mr-2" />
                            Tema Claro
                        </button>
                        
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                                theme === 'dark' 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <FaMoon className="mr-2" />
                            Tema Escuro
                        </button>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Tema atual:</strong> {theme === 'light' ? 'Claro' : 'Escuro'}</p>
                    </div>
                </div>

                {/* Card de Paginação */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <FaListOl className="text-2xl text-blue-500 mr-3" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Visualização de Listas</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Defina quantos itens devem ser exibidos por página nas tabelas do sistema.</p>
                    
                    <div>
                        <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Itens por página</label>
                        <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="mt-1 block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
                
                {/* Card de Usuários */}
                <UserRoleManager />
            </div>
        </div>
    );
};

export default SettingsPage;
