import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../../services/api';

const AdminLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const data = await adminService.getLogs({ page }, token);
            console.log('Logs data:', data.logs?.[0]); // Debug: see first log structure
            setLogs(data.logs || []);
            setTotalPages(data.total_pages || 1);
            setTotalLogs(data.total_logs || 0);
            setCurrentPage(page);
        } catch (error) {
            console.error("Error fetching logs:", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(currentPage);
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchLogs(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleExport = () => {
        if (!logs.length) return alert("No logs to export");

        const headers = ['Log ID', 'Action', 'Target Table', 'Action By', 'Details', 'Date'];
        const csvContent = [
            headers.join(','),
            ...logs.map(l => {
                // Get details from any available field, matching the display logic
                const details = l.action_details || l.details || l.description || '';
                return [
                    l.log_id,
                    l.action_type,
                    l.target_table || '',
                    `"${l.action_by_name || l.action_by || 'System'}"`,
                    `"${details.replace(/"/g, '""')}"`,
                    l.created_at
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `system_logs_page_${currentPage}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderPagination = () => {
        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                    Showing page {currentPage} of {totalPages} ({totalLogs} total logs)
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    {startPage > 1 && (
                        <>
                            <button
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-2 border rounded-lg hover:bg-white transition-colors"
                            >
                                1
                            </button>
                            {startPage > 2 && <span className="px-2">...</span>}
                        </>
                    )}

                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 border rounded-lg transition-colors ${currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'hover:bg-white'
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="px-2">...</span>}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-2 border rounded-lg hover:bg-white transition-colors"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Logs</h1>
                    <p className="text-gray-500">Audit trail of system activities</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Download size={20} /> Export Current Page
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No logs found.</td></tr>
                        ) : (
                            logs.map((l, idx) => (
                                <tr key={l.log_id || idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${l.action_type === 'create' ? 'bg-green-100 text-green-800' :
                                            l.action_type === 'update' ? 'bg-blue-100 text-blue-800' :
                                                l.action_type === 'delete' ? 'bg-red-100 text-red-800' :
                                                    l.action_type === 'login' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {l.action_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                        <div className="capitalize">{l.target_table || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{l.action_by_name || l.action_by || 'System'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                        <div className="truncate" title={l.action_details || l.details || l.description || ''}>
                                            {l.action_details || l.details || l.description || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {new Date(l.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {!loading && logs.length > 0 && renderPagination()}
            </div>
        </div>
    );
};

export default AdminLogsPage;
