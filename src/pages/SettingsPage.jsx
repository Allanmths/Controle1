import React, { useState } from 'react';
import UserRoleManager from '../components/UserRoleManager';
import { useSettings } from '../context/SettingsContext';
import { FaListOl, FaUserPlus, FaDatabase } from 'react-icons/fa';
import { createDemoUsers } from '../utils/demoData';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const { itemsPerPage, setItemsPerPage } = useSettings();
    const [creatingDemo, setCreatingDemo] = useState(false);

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
    };

    const handleCreateDemoUsers = async () => {
        setCreatingDemo(true);
        const toastId = toast.loading('Criando usuários de demonstração...');
        
        try {
            const success = await createDemoUsers();
            if (success) {
                toast.success('Usuários demo criados com sucesso!', { id: toastId });
            } else {
                toast.error('Erro ao criar usuários demo', { id: toastId });
            }
        } catch (error) {
            toast.error('Erro ao criar usuários demo', { id: toastId });
        }
        
        setCreatingDemo(false);
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

                {/* Card de Dados Demo */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <FaDatabase className="text-2xl text-green-500 mr-3" />
                        <h3 className="text-xl font-bold text-gray-800">Dados de Demonstração</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                        Crie usuários de demonstração para testar o sistema de gerenciamento de roles e permissões.
                    </p>
                    
                    <button
                        onClick={handleCreateDemoUsers}
                        disabled={creatingDemo}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        <FaUserPlus className="mr-2" />
                        {creatingDemo ? 'Criando...' : 'Criar Usuários Demo'}
                    </button>
                    
                    <div className="mt-3 text-sm text-gray-600">
                        <p><strong>Usuários que serão criados:</strong></p>
                        <ul className="mt-1 space-y-1">
                            <li>• admin@demo.com (Administrador)</li>
                            <li>• manager@demo.com (Gerente)</li>
                            <li>• editor@demo.com (Editor)</li>
                            <li>• usuario@demo.com (Usuário)</li>
                            <li>• viewer@demo.com (Visualizador)</li>
                            <li>• inativo@demo.com (Usuário Inativo)</li>
                        </ul>
                    </div>
                </div>

                {/* Card de Usuários (existente) */}
                <UserRoleManager />
            </div>
        </div>
    );
};

export default SettingsPage;
