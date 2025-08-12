import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaFilePdf, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
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
    const [adjustments, setAdjustments] = useState([]);

    useEffect(() => {
        async function fetchCount() {
            setLoading(true);
            try {
                const docRef = doc(db, 'counts', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const countData = { id: docSnap.id, ...data };
                    setCount(countData);
                    setCanEdit(user && (user.email === data.userEmail || user.isAdmin));
                    
                    // Calcular ajustes necessários
                    if (countData.details) {
                        const needAdjustments = countData.details.filter(item => {
                            const difference = item.countedQuantity - item.expectedQuantity;
                            return difference !== 0;
                        });
                        setAdjustments(needAdjustments);
                    }
                } else {
                    setCount(null);
                    setAdjustments([]);
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
        if (!count || !count.details || count.details.length === 0) {
            toast.error('Não há dados de contagem para aplicar.');
            return;
        }
        
        if (!window.confirm('Tem certeza que deseja aplicar este ajuste no estoque? Esta ação não pode ser desfeita.')) {
            return;
        }

        setApplying(true);
        try {
            const batch = writeBatch(db);
            
            // Para cada item da contagem, aplicar o ajuste no estoque
            for (const item of count.details) {
                const { productId, locationId, countedQuantity, expectedQuantity } = item;
                const difference = countedQuantity - expectedQuantity;
                
                if (difference !== 0) {
                    // Buscar o produto e atualizar a quantidade na localização
                    const productRef = doc(db, 'products', productId);
                    
                    // Precisamos buscar o produto atual para atualizar
                    const productSnap = await getDoc(productRef);
                    if (productSnap.exists()) {
                        const productData = productSnap.data();
                        const currentLocations = productData.locations || {};
                        
                        // Atualizar a quantidade na localização específica
                        currentLocations[locationId] = countedQuantity;
                        
                        // Atualizar o documento do produto
                        batch.update(productRef, {
                            locations: currentLocations,
                            lastUpdated: new Date()
                        });
                        
                        // Criar um registro de movimentação para auditoria
                        const movementRef = doc(collection(db, 'movements'));
                        batch.set(movementRef, {
                            type: 'adjustment',
                            productId: productId,
                            productName: item.productName,
                            locationId: locationId,
                            locationName: item.locationName,
                            quantityBefore: expectedQuantity,
                            quantityAfter: countedQuantity,
                            quantityChanged: difference,
                            reason: `Ajuste por contagem - ID: ${count.fileId || count.id}`,
                            userId: user?.uid,
                            userEmail: user?.email,
                            timestamp: new Date(),
                            createdAt: new Date()
                        });
                    }
                }
            }
            
            // Marcar a contagem como aplicada
            const countRef = doc(db, 'counts', count.id);
            batch.update(countRef, {
                status: 'aplicado',
                appliedAt: new Date(),
                appliedBy: user?.email || 'N/A'
            });
            
            // Executar todas as operações
            await batch.commit();
            
            // Atualizar o estado local
            setCount(prev => ({
                ...prev,
                status: 'aplicado',
                appliedAt: new Date(),
                appliedBy: user?.email || 'N/A'
            }));
            
            toast.success('Ajuste aplicado com sucesso! O estoque foi atualizado.');
        } catch (error) {
            console.error('Erro ao aplicar ajuste:', error);
            toast.error('Erro ao aplicar ajuste. Tente novamente.');
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
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Relatório da Contagem</h2>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-gray-600">
                            Realizada em {count.createdAt?.toDate().toLocaleString('pt-BR')} por {count.userEmail}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                            <p className="text-gray-600">
                                {count.locationName && <span>Localização: <strong>{count.locationName}</strong></span>}
                                {count.fileId && <span className="ml-4">ID: <strong>{count.fileId}</strong></span>}
                            </p>
                            <div>
                                {count.status === 'aplicado' ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        ✅ Ajuste Aplicado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                        ⏳ Pendente de Aplicação
                                    </span>
                                )}
                            </div>
                        </div>
                        {count.status === 'aplicado' && count.appliedAt && (
                            <p className="text-sm text-green-600 mt-1">
                                Aplicado em {new Date(count.appliedAt.toDate ? count.appliedAt.toDate() : count.appliedAt).toLocaleString('pt-BR')}
                                {count.appliedBy && ` por ${count.appliedBy}`}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => exportReportToPDF(count)}
                        className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        <FaFilePdf className="mr-2" /> Exportar PDF
                    </button>
                </div>
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

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <button 
                    onClick={() => navigate('/counting')}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                    ← Voltar
                </button>
                
                {canEdit && adjustments.length > 0 && count.status !== 'aplicado' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex-1">
                                <p className="text-amber-800 font-medium">
                                    {adjustments.length} ajuste{adjustments.length > 1 ? 's' : ''} necessário{adjustments.length > 1 ? 's' : ''}
                                </p>
                                <p className="text-amber-600 text-sm">
                                    Clique para aplicar automaticamente no estoque
                                </p>
                            </div>
                            <button 
                                onClick={handleApplyAdjustment}
                                disabled={applying}
                                className={`flex items-center px-6 py-2 rounded-md font-semibold transition-colors ${
                                    applying 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {applying ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Aplicando...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className="mr-2" />
                                        Aplicar Ajustes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {count.status === 'aplicado' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center text-green-800">
                            <FaCheck className="mr-2 text-green-600" />
                            <span className="font-medium">Ajustes aplicados com sucesso</span>
                        </div>
                    </div>
                )}
            </div>
        </div>


    );
}

export default CountReportPage;

