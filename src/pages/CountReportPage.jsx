import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaFilePdf } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, writeBatch, collection } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const DifferenceCell = ({ difference }) => {
    let color = 'text-gray-800';
    let sign = '';
    if (difference > 0) {
        color = 'text-green-600 font-bold';
        sign = '+';
    } else if (difference < 0) {
        color = 'text-red-600 font-bold';
    }
    return <td className={`px-6 py-4 whitespace-nowrap text-sm ${color}`}>{sign}{difference}</td>;
};

function CountReportPage() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(null);
    const [canEdit, setCanEdit] = useState(false);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        async function fetchCount() {
            setLoading(true);
            try {
                const docRef = doc(db, 'counts', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCount({ id: docSnap.id, ...data });
                    setCanEdit(user && (user.email === data.userEmail || user.isAdmin));
                } else {
                    setCount(null);
                }
            } catch (error) {
                toast.error('Erro ao carregar relatório de contagem.');
                setCount(null);
            } finally {
                setLoading(false);
            }
        }
        fetchCount();
    }, [id, user]);

    async function handleApplyAdjustment() {
        if (!count) return;
        setApplying(true);
        try {
            // Lógica de ajuste de estoque (exemplo)
            const batch = writeBatch(db);
            // ...adicionar operações de batch aqui...
            // await batch.commit();
            toast.success('Ajuste aplicado com sucesso!');
        } catch (error) {
            toast.error('Erro ao aplicar ajuste.');
        } finally {
            setApplying(false);
        }
    }

    function exportReportToPDF(count) {
        if (!count) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Relatório da Contagem', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Data: ${count.createdAt?.toDate ? count.createdAt.toDate().toLocaleString('pt-BR') : ''}`, 14, 30);
        doc.text(`Usuário: ${count.userEmail || ''}`, 14, 36);
        if (count.locationName) doc.text(`Localidade: ${count.locationName}`, 14, 42);
        if (count.fileId) doc.text(`ID Arquivo: ${count.fileId}`, 14, 48);

        const tableColumn = [
            'Produto',
            'Qtd. Sistema',
            'Qtd. Contada',
            'Diferença',
            'Localidade'
        ];
        // ...restante da lógica de exportação...
    }

    if (loading) return <p className="text-center p-4">Carregando relatório...</p>;
    if (!count) return <p className="text-center p-4">Relatório de contagem não encontrado.</p>;

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Relatório da Contagem</h2>
            <p className="text-gray-600">Realizada em {count.createdAt?.toDate().toLocaleString('pt-BR')} por {count.userEmail}</p>
            <div className="flex items-center space-x-2 mb-6">
                <p className="text-gray-600">
                    {count.locationName && <span>Localidade: <strong>{count.locationName}</strong> • </span>}
                    {count.fileId && <span>ID do arquivo: <strong>{count.fileId}</strong></span>}
                </p>
                <button
                    onClick={() => exportReportToPDF(count)}
                    className="ml-4 flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    <FaFilePdf className="mr-2" /> Exportar PDF
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Sistema</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Contada</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diferença</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localidade</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {count.details.map(item => {
                                const difference = item.countedQuantity - item.expectedQuantity;
                                return (
                                    <tr key={item.productId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expectedQuantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.countedQuantity}</td>
                                        <DifferenceCell difference={difference} />
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.locationName || count.locationName || 'Desconhecida'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
                <button 
                    onClick={() => navigate('/counting')}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                    Voltar
                </button>
                {canEdit && count.status !== 'aplicado' && (
                    <div className="mt-6 text-right">
                        <button 
                            onClick={handleApplyAdjustment}
                            disabled={applying}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-300"
                        >
                            {applying ? 'Aplicando...' : 'Aplicar Ajuste no Estoque'}
                        </button>
                    </div>
                )}
            </div>
        </div>


    );
}

export default CountReportPage;

