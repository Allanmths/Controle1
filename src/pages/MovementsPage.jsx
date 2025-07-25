import React from 'react';
import StockTransferForm from '../components/StockTransferForm';
import StockExitForm from '../components/StockExitForm';

const MovementsPage = () => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Movimentações de Estoque</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna de Transferência */}
                <StockTransferForm />

                {/* Coluna de Saída */}
                <StockExitForm />
import { useAuth } from '../contexts/AuthContext';
import useFirestore from '../hooks/useFirestore';
import Pagination from '../components/Pagination';
import MovementFormModal from '../components/MovementFormModal';

const MovementsPage = () => {
    const { userData } = useAuth();
    const { docs: movements, loading: loadingMovements } = useFirestore('movements', { field: 'date', direction: 'desc' });
    const { docs: products, loading: loadingProducts } = useFirestore('products');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const canEdit = userData?.role === 'admin' || userData?.role === 'editor';

    const loading = loadingMovements || loadingProducts;

    const totalPages = Math.ceil(movements.length / itemsPerPage);
    const paginatedMovements = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return movements.slice(startIndex, startIndex + itemsPerPage);
    }, [movements, currentPage, itemsPerPage]);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const MovementRow = ({ movement, products }) => {
        const product = products.find(p => p.id === movement.productId);
        const date = movement.date?.toDate().toLocaleString('pt-BR') || 'Data indefinida';

        let typeLabel, typeColor;
        switch (movement.type) {
            case 'entrada': typeLabel = 'Entrada'; typeColor = 'bg-green-100 text-green-800'; break;
            case 'saida': typeLabel = 'Saída'; typeColor = 'bg-red-100 text-red-800'; break;
            case 'ajuste': typeLabel = 'Ajuste'; typeColor = 'bg-blue-100 text-blue-800'; break;
            default: typeLabel = 'N/A'; typeColor = 'bg-gray-100 text-gray-800';
        }

        return (
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product ? product.name : 'Produto não encontrado'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColor}`}>
                        {typeLabel}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{movement.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.motive || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.userEmail || 'Sistema'}</td>
            </tr>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Histórico de Movimentações</h2>
                {canEdit && (
                    <button onClick={handleOpenModal} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <i className="fas fa-plus mr-2"></i>
                        Registrar Movimentação
                    </button>
                )}
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-4">Carregando...</td></tr>
                        ) : paginatedMovements.length > 0 ? (
                            paginatedMovements.map(mov => <MovementRow key={mov.id} movement={mov} products={products} />)
                        ) : (
                            <tr><td colSpan="6" className="text-center p-4">Nenhuma movimentação encontrada.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            <MovementFormModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
    );
};

export default MovementsPage;
