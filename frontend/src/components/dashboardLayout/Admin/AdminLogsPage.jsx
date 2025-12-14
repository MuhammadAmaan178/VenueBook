// components/dashboardLayout/Admin/AdminLogsPage.jsx
import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight, Activity, Clock, ChevronDown } from 'lucide-react';
import { adminService } from '../../../services/api';

const AdminLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const data = await adminService.getLogs({ page, per_page: 15 }, token);
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

    const handleExport = async (type) => {
        setShowExportMenu(false);

        let logsToExport = [];

        if (type === 'current') {
            logsToExport = logs;
            if (!logsToExport.length) return alert("No logs to export on current page");
        } else {
            try {
                const token = localStorage.getItem('token');
                // Fetch all logs (large limit)
                const data = await adminService.getLogs({ page: 1, per_page: 100000 }, token);
                logsToExport = data.logs || [];
                if (!logsToExport.length) return alert("No logs found to export");
            } catch (error) {
                console.error("Error fetching all logs for export:", error);
                return alert("Failed to fetch all logs");
            }
        }

        const headers = ['Log ID', 'Action', 'Target Table', 'Action By', 'Details', 'Date'];
        const csvContent = [
            headers.join(','),
            ...logsToExport.map(l => {
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
        link.setAttribute('download', `system_logs_${type}_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="text-sm font-medium text-gray-500">
                    Page <span className="text-gray-900">{currentPage}</span> of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {/* Simplified numbered pagination for aesthetics, can be expanded if needed */}
                    <div className="hidden sm:flex gap-1">
                        {pages.map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                    : 'hover:bg-white text-gray-600'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
                    <p className="text-gray-500 mt-1">Audit trail & system activities</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <Download size={18} /> Export CSV <ChevronDown size={16} />
                    </button>
                    {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-1 z-50">
                            <button
                                onClick={() => handleExport('current')}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                            >
                                Current Page
                            </button>
                            <button
                                onClick={() => handleExport('all')}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                            >
                                All Logs
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Activity Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading logs activity...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No activity logs found.</td></tr>
                            ) : (
                                logs.map((l, idx) => (
                                    <tr key={l.log_id || idx} className="hover:bg-red-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${l.action_type === 'create' ? 'bg-green-500' :
                                                    l.action_type === 'update' ? 'bg-blue-500' :
                                                        l.action_type === 'delete' ? 'bg-red-500' :
                                                            'bg-purple-500'
                                                    }`}></span>
                                                <span className="font-bold text-gray-700 uppercase text-xs tracking-wide">
                                                    {l.action_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium uppercase">
                                                {l.target_table || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {l.action_by_name || l.action_by || 'System'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-500 max-w-xs truncate" title={l.action_details || l.details || l.description || ''}>
                                                {l.action_details || l.details || l.description || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock size={14} className="text-gray-400" />
                                                {new Date(l.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && logs.length > 0 && renderPagination()}
            </div>
        </div>
    );
};

export default AdminLogsPage;
