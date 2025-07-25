﻿import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFirestore from '../hooks/useFirestore';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { FaWifi, FaBan, FaPlus, FaHistory } from 'react-icons/fa';

const CountStatusBadge = ({ status }) => {
    let label, color;
    switch (status) {
        case 'concluido':
            label = 'ConcluÃ­do';
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
    const { userData } = useAuth();
    const { docs: counts, loading } = useFirestore('counts', { field: 'createdAt', direction: 'desc' });
    const { isOnline, offlineData, hasOfflineData } = useOfflineMode();
    const navigate = useNavigate();

    const canEdit = userData?.role === 'admin' || userData?.role === 'editor';

    // Combinar contagens online e offline
    const allCounts = [
        ...(counts || []),
        ...(offlineData.counts || [])
    ].sort((a, b) => {
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
                        {hasOfflineData && (
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <FaHistory />
                                <span>{offlineData.counts.length} contagem(ns) offline</span>
                            </div>
                        )}
                    </div>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => navigate('/counting/new')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                    >
                        <FaPlus className="mr-2" />
                        Iniciar Nova Contagem
                    </button>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">HistÃ³rico de Contagens</h3>
                {loading ? (
                    <p className="text-center text-gray-500 py-4">Carregando histÃ³rico...</p>
                ) : allCounts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhuma contagem realizada ainda.</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {allCounts.map(count => {
                            const isOfflineCount = count.status === 'offline';
                            const displayDate = count.createdAt?.toDate?.() 
                                ? count.createdAt.toDate().toLocaleDateString('pt-BR')
                                : new Date(count.timestamp || count.createdAt).toLocaleDateString('pt-BR');
                            
                            return (
                                <li key={count.id} className={`py-4 flex justify-between items-center ${isOfflineCount ? 'bg-orange-50 border-l-4 border-orange-400 pl-4' : ''}`}>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-lg font-semibold text-gray-900">
                                                Contagem de {displayDate}
                                            </p>
                                            {isOfflineCount && (
                                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                                    Offline
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Realizada por: {count.userEmail || count.userName || 'N/A'}
                                        </p>
                                        {isOfflineCount && !count.synced && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                Aguardando sincronizaÃ§Ã£o
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <CountStatusBadge status={count.status} />
                                        {!isOfflineCount && (
                                            <button 
                                                onClick={() => navigate(`/counting/${count.id}`)} 
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                            >
                                                Ver RelatÃ³rio
                                            </button>
                                        )}
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
