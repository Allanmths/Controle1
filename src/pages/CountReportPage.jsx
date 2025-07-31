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
  const tableRows = (count.details || []).map(item => [
    item.productName,
    item.expectedQuantity,
    item.countedQuantity,
    (item.countedQuantity - item.expectedQuantity),
    item.locationName || count.locationName || 'Desconhecida'
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 55,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }
  doc.save(`relatorio_contagem_${count.fileId || count.id || ''}.pdf`);
}

export default function CountReportPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();
    const [count, setCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    const canEdit = userData?.role === 'admin' || userData?.role === 'editor';

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const countRef = doc(db, 'counts', id);
                const countSnap = await getDoc(countRef);
                if (countSnap.exists()) {
                    setCount({ id: countSnap.id, ...countSnap.data() });
                } else {
                    console.error('No such count!');
                }
            } catch (error) {
                console.error('Error fetching count:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCount();
    }, [id]);

    const handleApplyAdjustment = async () => {
        if (!count || count.status === 'aplicado') return;
        if (!window.confirm('Tem certeza que deseja aplicar este ajuste? Esta ação atualizará o estoque de todos os produtos listados e não pode ser desfeita.')) return;

        setApplying(true);
        
        const promise = new Promise(async (resolve, reject) => {
            const batch = writeBatch(db);
            try {
                count.details.forEach(item => {
                    const difference = item.countedQuantity - item.expectedQuantity;
                    if (difference !== 0) {
                        const productRef = doc(db, 'products', item.productId);
                        
                        // Atualizar o estoque total
                        // Também atualizar o estoque na localidade específica
                        if (count.countType === 'location' && count.locationId) {
                            // Atualizar estoque na localidade específica
                            batch.update(productRef, { 
                                totalQuantity: item.countedQuantity,
                                [`locations.${count.locationId}`]: item.countedQuantity 
                            });
                        } else {
                            // Atualização normal apenas do estoque total
                            batch.update(productRef, { totalQuantity: item.countedQuantity });
                        }

                        const movementRef = doc(collection(db, 'movements'));
                        batch.set(movementRef, {
                            productId: item.productId,
                            type: 'ajuste',
                            quantity: Math.abs(difference),
                            motive: `Ajuste de inventário (${difference > 0 ? 'sobra' : 'perda'})`,
                            locationId: count.locationId || null,
                            locationName: count.locationName || 'Geral',
                            date: new Date(),
                            userEmail: currentUser?.email || 'N/A',
                        });
                    }
                });

                const countRef = doc(db, 'counts', id);
                batch.update(countRef, { status: 'aplicado' });

                await batch.commit();
                resolve();
            } catch (error) {
                console.error('Error applying adjustment:', error);
                reject(error);
            }
        });

        toast.promise(promise, {
            loading: 'Aplicando ajuste...',
            success: 'Ajuste de estoque aplicado com sucesso!',
            error: 'Falha ao aplicar o ajuste.',
        }).then(() => {
            navigate('/counting');
        }).finally(() => {
            setApplying(false);
        });
    };

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
