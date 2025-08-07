import React, { useState, useMemo } from 'react';
import { FaExchangeAlt, FaCalendarAlt, FaSearch, FaFilter, FaSignOutAlt } from 'react-icons/fa';
import useFirestore from '../hooks/useFirestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MovementHistory = () => {
    const { docs: kardexData, loading } = useFirestore('kardex', { field: 'timestamp', direction: 'desc' });
    const { docs: products } = useFirestore('products');
    const { docs: locations } = useFirestore('locations');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [movementType, setMovementType] = useState('all'); // 'all', 'transfers', 'exits'

    // Processar transferências (agrupadas por operação)
    const transferHistory = useMemo(() => {
        if (!kardexData) return [];

        const transfers = [];
        const transferOuts = kardexData.filter(item => item.type === 'transfer_out');

        transferOuts.forEach(outItem => {
            const inItem = kardexData.find(item => 
                item.type === 'transfer_in' && 
                item.productId === outItem.productId &&
                item.userId === outItem.userId &&
                Math.abs(new Date(item.timestamp?.toDate?.() || item.timestamp) - 
                        new Date(outItem.timestamp?.toDate?.() || outItem.timestamp)) < 5000
            );

            if (inItem) {
                const product = products?.find(p => p.id === outItem.productId);
                const fromLocation = locations?.find(l => l.id === outItem.locationId);
                const toLocation = locations?.find(l => l.id === inItem.locationId);

                transfers.push({
                    id: `${outItem.id}-${inItem.id}`,
                    type: 'transfer',
                    productId: outItem.productId,
                    productName: product?.name || outItem.productName,
                    fromLocationId: outItem.locationId,
                    fromLocationName: fromLocation?.name || 'Local não encontrado',
                    toLocationId: inItem.locationId,
                    toLocationName: toLocation?.name || 'Local não encontrado',
                    quantity: outItem.quantity,
                    timestamp: outItem.timestamp,
                    userId: outItem.userId,
                    userEmail: outItem.userEmail,
                    outItem,
                    inItem
                });
            }
        });

        return transfers;
    }, [kardexData, products, locations]);

    // Processar saídas de estoque
    const exitHistory = useMemo(() => {
        if (!kardexData) return [];

        const exits = kardexData
            .filter(item => item.type === 'exit')
            .map(exitItem => {
                const product = products?.find(p => p.id === exitItem.productId);
                const location = locations?.find(l => l.id === exitItem.locationId);

                return {
                    id: exitItem.id,
                    type: 'exit',
                    productId: exitItem.productId,
                    productName: product?.name || exitItem.productName,
                    locationId: exitItem.locationId,
                    locationName: location?.name || 'Local não encontrado',
                    quantity: exitItem.quantity,
                    timestamp: exitItem.timestamp,
                    userId: exitItem.userId,
                    userEmail: exitItem.userEmail,
                    reason: exitItem.reason || 'Não informado'
                };
            });

        return exits;
    }, [kardexData, products, locations]);

    // Combinar históricos baseado no filtro
    const combinedHistory = useMemo(() => {
        let combined = [];
        
        if (movementType === 'all' || movementType === 'transfers') {
            combined = [...combined, ...transferHistory];
        }
        
        if (movementType === 'all' || movementType === 'exits') {
            combined = [...combined, ...exitHistory];
        }

        return combined.sort((a, b) => {
            const dateA = new Date(a.timestamp?.toDate?.() || a.timestamp);
            const dateB = new Date(b.timestamp?.toDate?.() || b.timestamp);
            return dateB - dateA;
        });
    }, [transferHistory, exitHistory, movementType]);

    // Aplicar filtros
    const filteredMovements = useMemo(() => {
        let filtered = combinedHistory;

        // Filtro por termo de busca
        if (searchTerm) {
            filtered = filtered.filter(movement =>
                movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movement.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (movement.type === 'transfer' && (
                    movement.fromLocationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    movement.toLocationName.toLowerCase().includes(searchTerm.toLowerCase())
                )) ||
                (movement.type === 'exit' && 
                    movement.locationName.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Filtro por produto
        if (selectedProduct) {
            filtered = filtered.filter(movement => movement.productId === selectedProduct);
        }

        // Filtro por localidade
        if (selectedLocation) {
            filtered = filtered.filter(movement => {
                if (movement.type === 'transfer') {
                    return movement.fromLocationId === selectedLocation || 
                           movement.toLocationId === selectedLocation;
                } else {
                    return movement.locationId === selectedLocation;
                }
            });
        }

        // Filtro por data
        if (startDate) {
            filtered = filtered.filter(movement => {
                const movementDate = new Date(movement.timestamp?.toDate?.() || movement.timestamp);
                return movementDate >= new Date(startDate);
            });
        }

        if (endDate) {
            filtered = filtered.filter(movement => {
                const movementDate = new Date(movement.timestamp?.toDate?.() || movement.timestamp);
                return movementDate <= new Date(endDate + 'T23:59:59');
            });
        }

        return filtered;
    }, [combinedHistory, searchTerm, selectedProduct, selectedLocation, startDate, endDate]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedProduct('');
        setSelectedLocation('');
        setStartDate('');
        setEndDate('');
        setMovementType('all');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Carregando histórico...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Tipo de Movimentação */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo
                        </label>
                        <select
                            value={movementType}
                            onChange={(e) => setMovementType(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="all">Todas</option>
                            <option value="transfers">Transferências</option>
                            <option value="exits">Saídas</option>
                        </select>
                    </div>

                    {/* Busca */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Buscar
                        </label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Produto, localidade ou usuário..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Produto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Produto
                        </label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todos os produtos</option>
                            {products?.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Localidade */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Localidade
                        </label>
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Todas as localidades</option>
                            {locations?.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Data Início */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Data Início
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {/* Data Fim */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Data Fim
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                        >
                            <FaFilter />
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Total de Movimentações</p>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                                {filteredMovements.length}
                            </p>
                        </div>
                        <FaExchangeAlt className="text-3xl text-blue-500" />
                    </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Transferências</p>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                                {filteredMovements.filter(m => m.type === 'transfer').length}
                            </p>
                        </div>
                        <FaExchangeAlt className="text-3xl text-green-500" />
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 dark:text-red-400">Saídas</p>
                            <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                                {filteredMovements.filter(m => m.type === 'exit').length}
                            </p>
                        </div>
                        <FaSignOutAlt className="text-3xl text-red-500" />
                    </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Quantidade Total</p>
                            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                {filteredMovements.reduce((sum, m) => sum + m.quantity, 0)}
                            </p>
                        </div>
                        <FaCalendarAlt className="text-3xl text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Lista de Movimentações */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {filteredMovements.length === 0 ? (
                    <div className="p-12 text-center">
                        <FaExchangeAlt className="mx-auto text-4xl text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhuma movimentação encontrada
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {combinedHistory.length === 0 
                                ? "Ainda não foram realizadas movimentações no sistema."
                                : "Tente ajustar os filtros para encontrar as movimentações desejadas."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Data/Hora
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Produto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Movimentação
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Quantidade
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Usuário
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredMovements.map((movement) => {
                                    const movementDate = new Date(movement.timestamp?.toDate?.() || movement.timestamp);
                                    
                                    return (
                                        <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    movement.type === 'transfer' 
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                }`}>
                                                    {movement.type === 'transfer' ? 'Transferência' : 'Saída'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {format(movementDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {movement.productName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {movement.type === 'transfer' ? (
                                                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md mr-2">
                                                            {movement.fromLocationName}
                                                        </span>
                                                        <FaExchangeAlt className="mx-2 text-gray-400" />
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                                                            {movement.toLocationName}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md">
                                                            {movement.locationName}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {movement.quantity} unid.
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {movement.userEmail}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovementHistory;
