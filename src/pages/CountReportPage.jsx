import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FaFileExcel, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
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
            
            console.log('Iniciando aplicação de ajustes para contagem:', count);
            console.log('Detalhes da contagem:', count.details);
            
            // Para cada item da contagem, aplicar o ajuste no estoque
            for (const item of count.details) {
                const { productId, locationId, countedQuantity, expectedQuantity } = item;
                const difference = countedQuantity - expectedQuantity;
                
                console.log(`Processando produto ${item.productName}:`, {
                    productId,
                    locationId,
                    countedQuantity,
                    expectedQuantity,
                    difference
                });
                
                if (difference !== 0) {
                    // Buscar o produto e atualizar a quantidade na localização
                    const productRef = doc(db, 'products', productId);
                    
                    // Precisamos buscar o produto atual para atualizar
                    const productSnap = await getDoc(productRef);
                    if (productSnap.exists()) {
                        const productData = productSnap.data();
                        const currentLocations = productData.locations || {};
                        
                        console.log('Produto encontrado:', productData.name);
                        console.log('Localizações atuais:', currentLocations);
                        console.log('Atualizando localização:', locationId, 'para quantidade:', countedQuantity);
                        
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
                    } else {
                        console.error('Produto não encontrado:', productId);
                    }
                } else {
                    console.log(`Produto ${item.productName} não precisa de ajuste (diferença: 0)`);
                }
            }
            
            // Marcar a contagem como aplicada
            const countRef = doc(db, 'counts', count.id);
            batch.update(countRef, {
                status: 'aplicado',
                appliedAt: new Date(),
                appliedBy: user?.email || 'N/A'
            });
            
            console.log('Executando batch commit...');
            // Executar todas as operações
            await batch.commit();
            console.log('Batch commit executado com sucesso!');
            
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
            toast.error(`Erro ao aplicar ajuste: ${error.message}`);
        } finally {
            setApplying(false);
        }
    }

    function exportReportToExcel(count) {
        if (!count) return;

        try {
            // Criar dados de cabeçalho com informações da contagem
            const headerData = [
                ['RELATÓRIO DE CONTAGEM DE ESTOQUE'],
                [],
                ['Data:', count.createdAt?.toDate ? count.createdAt.toDate().toLocaleString('pt-BR') : 'N/A'],
                ['Usuário:', count.userEmail || 'N/A'],
                ['Localidade:', count.locationName || 'N/A'],
                ['ID do Arquivo:', count.fileId || 'N/A'],
                ['Status:', count.status === 'aplicado' ? 'Ajuste Aplicado' : 'Pendente de Aplicação'],
                []
            ];

            // Criar dados da tabela
            const tableHeaders = ['Produto', 'Qtd. Sistema', 'Qtd. Contada', 'Diferença', 'Localidade', 'Status'];
            const tableData = count.details.map(item => {
                const difference = item.countedQuantity - item.expectedQuantity;
                let status = 'OK';
                if (difference > 0) status = 'EXCEDENTE';
                else if (difference < 0) status = 'FALTANTE';

                return [
                    item.productName || '',
                    item.expectedQuantity || 0,
                    item.countedQuantity || 0,
                    difference,
                    item.locationName || count.locationName || 'Desconhecida',
                    status
                ];
            });

            // Adicionar linha de resumo
            const totalExpected = count.details.reduce((sum, item) => sum + (item.expectedQuantity || 0), 0);
            const totalCounted = count.details.reduce((sum, item) => sum + (item.countedQuantity || 0), 0);
            const totalDifference = totalCounted - totalExpected;

            const summaryData = [
                [],
                ['RESUMO DA CONTAGEM'],
                ['Total de Produtos:', count.details.length],
                ['Qtd. Total Sistema:', totalExpected],
                ['Qtd. Total Contada:', totalCounted],
                ['Diferença Total:', totalDifference]
            ];

            // Combinar todos os dados
            const worksheetData = [
                ...headerData,
                tableHeaders,
                ...tableData,
                ...summaryData
            ];

            // Criar planilha
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Definir larguras das colunas
            worksheet['!cols'] = [
                { wch: 30 }, // Produto
                { wch: 15 }, // Qtd. Sistema
                { wch: 15 }, // Qtd. Contada
                { wch: 12 }, // Diferença
                { wch: 20 }, // Localidade
                { wch: 15 }  // Status
            ];

            // Estilizar células do cabeçalho
            const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
            for (let row = 0; row < headerData.length + 1; row++) {
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    if (worksheet[cellAddress]) {
                        worksheet[cellAddress].s = {
                            font: { bold: true },
                            alignment: { horizontal: 'left' }
                        };
                    }
                }
            }

            // Criar workbook e adicionar a planilha
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Contagem');

            // Gerar nome do arquivo
            const dataContagem = count.createdAt?.toDate 
                ? count.createdAt.toDate().toLocaleDateString('pt-BR').replace(/\//g, '-')
                : 'sem-data';
            const fileName = `Contagem_${dataContagem}_${count.fileId || 'relatorio'}.xlsx`;

            // Fazer download do arquivo
            XLSX.writeFile(workbook, fileName);
            
            toast.success('Relatório exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            toast.error('Erro ao exportar relatório');
        }
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
                        onClick={() => exportReportToExcel(count)}
                        className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        <FaFileExcel className="mr-2" /> Exportar Excel
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

