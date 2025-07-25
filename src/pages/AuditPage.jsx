import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import useFirestore from '../hooks/useFirestore';
import { format } from 'date-fns';
import Pagination from '../components/Pagination';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaFilter, FaCalendarAlt, FaTimesCircle } from 'react-icons/fa';

const AuditLogRow = ({ log }) => {
    const formattedTimestamp = log.timestamp ? format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss') : 'N/A';

    const getTypeStyle = (type) => {
        switch (type) {
            case 'entrada_inicial': return { label: 'Entrada Inicial', color: 'bg-green-100 text-green-800' };
            case 'ajuste_manual': return { label: 'Ajuste Manual', color: 'bg-yellow-100 text-yellow-800' };
            case 'transfer_in': return { label: 'TransferÃªncia (Entrada)', color: 'bg-blue-100 text-blue-800' };
            case 'transfer_out': return { label: 'TransferÃªncia (SaÃ­da)', color: 'bg-purple-100 text-purple-800' };
            case 'saida': return { label: 'SaÃ­da Manual', color: 'bg-red-100 text-red-800' };
            default: return { label: type, color: 'bg-gray-100 text-gray-800' };
        }
    };

    const { label, color } = getTypeStyle(log.type);

    return (
        <tr className="hover:bg-gray-50 transition-colors duration-150">
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formattedTimestamp}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{log.productName}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                    {label}
                </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-center">{log.quantity}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{log.userEmail || 'N/A'}</td>
            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.details}>{log.details}</td>
        </tr>
    );
};

const AuditPage = () => {
    const { itemsPerPage } = useSettings();
    const { docs: logs, loading } = useFirestore('kardex', { field: 'timestamp', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [filterType, setFilterType] = useState('');

    const movementTypes = {
        'entrada_inicial': 'Entrada Inicial',
        'ajuste_manual': 'Ajuste Manual',
        'transfer_in': 'TransferÃªncia (Entrada)',
        'transfer_out': 'TransferÃªncia (SaÃ­da)',
        'saida': 'SaÃ­da Manual'
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = log.timestamp?.toDate();
            if (!logDate) return false;

            const isAfterStartDate = !startDate || logDate >= startDate;
            const isBeforeEndDate = !endDate || logDate <= new Date(endDate.getTime() + 86400000); // Include the whole end day
            const matchesType = !filterType || log.type === filterType;

            return isAfterStartDate && isBeforeEndDate && matchesType;
        });
    }, [logs, startDate, endDate, filterType]);

    const clearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setFilterType('');
    };

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Auditoria de Movimentações</h2>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    {/* Date Start */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data InÃ­cio</label>
                        <FaCalendarAlt className="absolute top-9 left-3 text-gray-400 z-10" />
                        <DatePicker 
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            dateFormat="dd/MM/yyyy"
                            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholderText="dd/mm/aaaa"
                        />
                    </div>
                    {/* Date End */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                        <FaCalendarAlt className="absolute top-9 left-3 text-gray-400 z-10" />
                        <DatePicker 
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            dateFormat="dd/MM/yyyy"
                            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholderText="dd/mm/aaaa"
                        />
                    </div>
                    {/* Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimento</label>
                        <select 
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            {movementTypes && Object.entries(movementTypes).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                    {/* Clear Button */}
                    <div>
                        <button 
                            onClick={clearFilters}
                            className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            <FaTimesCircle />
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UsuÃ¡rio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-10">Carregando registros...</td></tr>
                        ) : paginatedLogs && paginatedLogs.length > 0 ? (
                            paginatedLogs.map(log => <AuditLogRow key={log.id} log={log} />)
                        ) : (
                            <tr><td colSpan="6" className="text-center py-10">Nenhum registro de auditoria encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
        </div>
    );
};

export default AuditPage;
