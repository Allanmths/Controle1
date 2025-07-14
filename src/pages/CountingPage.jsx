import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFirestore from '../hooks/useFirestore';

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
    const { userData } = useAuth();
    const { docs: counts, loading } = useFirestore('counts', { field: 'createdAt', direction: 'desc' });
    const navigate = useNavigate();

    const canEdit = userData?.role === 'admin' || userData?.role === 'editor';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Contagem de Estoque</h2>
                {canEdit && (
                    <button 
                        onClick={() => navigate('/counting/new')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Iniciar Nova Contagem
                    </button>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Contagens</h3>
                {loading ? (
                    <p className="text-center text-gray-500 py-4">Carregando histórico...</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {counts.length > 0 ? counts.map(count => (
                            <li key={count.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">Contagem de {count.createdAt?.toDate().toLocaleDateString('pt-BR')}</p>
                                    <p className="text-sm text-gray-500">Realizada por: {count.userEmail || 'N/A'}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <CountStatusBadge status={count.status} />
                                                                        <button onClick={() => navigate(`/counting/${count.id}`)} className="text-indigo-600 hover:text-indigo-900">Ver Relatório</button>
                                </div>
                            </li>
                        )) : (
                            <p className="text-center text-gray-500 py-4">Nenhuma contagem realizada ainda.</p>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
