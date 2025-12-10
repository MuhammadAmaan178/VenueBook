import React, { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { adminService } from '../../../services/api';

const AdminLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        action_type: '',
        target_table: '',
        date_from: '',
        date_to: ''
    });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const filterParams = {};
            if (filters.action_type) filterParams.action_type = filters.action_type;
            if (filters.target_table) filterParams.target_table = filters.target_table;
            if (filters.date_from) filterParams.date_from = filters.date_from;
            if (filters.date_to) filterParams.date_to = filters.date_to;

            const data = await adminService.getLogs(filterParams, token);
            setLogs(data.logs || []);
        } catch (error) {
            console.error("Error fetching logs:", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleExport = () => {
        if (!logs.length) return alert("No logs to export");

        const headers = ['Log ID', 'Action', 'Target Table', 'Record ID', 'Action By', 'Details', 'Date'];
        const csvContent = [
            headers.join(','),
            ...logs.map(l => [
                l.log_id,
                l.action_type,
                l.target_table || '',
                l.record_id || '',
                `"${l.action_by_name || l.action_by || 'System'}"`,
                `"${(l.action_details || '').replace(/"/g, '""')}"`,
                l.created_at
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'system_logs.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        // Clear all filters.
        setFilters({ action_type: '', target_table: '', date_from: '', date_to: '' });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Logs</h1>
                    <p className="text-gray-500">Audit trail of system activities</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        <Filter size={20} /> Filter
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        <Download size={20} /> Export
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 grid grid-cols-4 gap-4">
                    <select value={filters.action_type} onChange={(e) => handleFilterChange('action_type', e.target.value)} className="border rounded px-3 py-2">
                        <option value="">All Actions</option>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="delete">Delete</option>
                        <option value="login">Login</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Target Table (e.g. venues)"
                        value={filters.target_table}
                        onChange={(e) => handleFilterChange('target_table', e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                    <input type="date" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} className="border rounded px-3 py-2" />
                    <button onClick={clearFilters} className="text-gray-600">Clear</button>
                </div>
            )}

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
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No logs found.</td></tr>
                        ) : (
                            logs.map((l, idx) => (
                                <tr key={l.log_id || idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs uppercase font-bold">{l.action_type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700 capitalize">{l.target_table || 'N/A'} #{l.record_id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{l.action_by_name || l.action_by || 'System'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={l.action_details}>{l.action_details}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminLogsPage;
