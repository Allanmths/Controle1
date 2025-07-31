import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFirestore from '../hooks/useFirestore';
// Offline removido

import { FaWifi, FaBan, FaPlus, FaHistory, FaBarcode } from 'react-icons/fa';
import { useOfflineMode } from '../hooks/useOfflineMode';

const CountStatusBadge = ({ status }) => {
    let label, color;
    switch (status) {
        case 'concluido':
            label = 'Concluído';
            color = 'bg-green-100 text-green-800';
            break;
        case 'aplicado':
            label = 'Ajuste Aplicado';
            color = 'bg-blue-100 text-blue-800';
            break;
        default:
            label = 'Em Andamento';
            color = 'bg-yellow-100 text-yellow-800';
    }
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>{label}</span>;
};

export default function CountingPage() {
    const { isOnline } = useOfflineMode();
    const { userData } = useAuth();
    const { docs: counts, loading } = useFirestore('counts', { field: 'createdAt', direction: 'desc' });
    // Sempre online
    const navigate = useNavigate();

    const canEdit = userData?.role === 'admin' || userData?.role === 'editor';

    // Apenas contagens online
    const allCounts = (counts || []).sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.timestamp) || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.timestamp) || new Date(b.createdAt);
        return dateB - dateA;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Contagem de Estoque</h2>
                    <div className="flex items-center mt-2 space-x-4">
                        <div className={`flex items-center space-x-2 text-sm ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                                          {!isOnline ? <FaBan className="w-4 h-4" /> : <FaWifi className="w-4 h-4" />}
                            <span>{isOnline ? 'Online' : 'Modo Offline'}</span>
                        </div>
                        {/* ... */}
                    </div>
                </div>
                {canEdit && (
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => navigate('/counting/new')}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                        >
                            <FaPlus className="mr-2" />
                            Contagem por Localidade
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Contagens</h3>
                {loading ? (
                    <p className="text-center text-gray-500 py-4">Carregando histórico...</p>
                ) : allCounts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhuma contagem realizada ainda.</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {allCounts.map(count => {
                            const displayDate = count.createdAt?.toDate?.() 
                                ? count.createdAt.toDate().toLocaleDateString('pt-BR')
                                : new Date(count.timestamp || count.createdAt).toLocaleDateString('pt-BR');
                            return (
                                <li key={count.id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-lg font-semibold text-gray-900">
                                                Contagem de {displayDate}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Realizada por: {count.userEmail || count.userName || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <CountStatusBadge status={count.status} />
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                onClick={() => navigate(`/counting/${count.id}`)} 
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors px-3 py-1 border border-indigo-200 rounded-md"
                                            >
                                                Ver Relatório
                                            </button>
                                            {count.status !== 'aplicado' && count.fileId && (
                                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                    ID: {count.fileId || count.id.substring(0, 8)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
