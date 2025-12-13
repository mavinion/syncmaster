"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ShieldAlert, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    details: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
}

export default function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async (pageNum: number) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/audit-logs', {
                params: { page: pageNum, limit: 20 }
            });
            setLogs(response.data.logs);
            setTotalPages(response.data.pagination.pages);
            setPage(pageNum);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const formatDetails = (details: string | null) => {
        if (!details) return '-';
        try {
            const parsed = JSON.parse(details);
            return (
                <pre className="text-xs font-mono bg-gray-50 dark:bg-zinc-800 p-1 rounded max-w-sm overflow-x-auto">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            );
        } catch (e) {
            return <span className="text-sm">{details}</span>;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-zinc-900 border rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 dark:bg-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-purple-600" />
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Audit Logs</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Tracks critical admin actions</span>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                )}

                {error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : logs.length === 0 && !loading ? (
                    <div className="p-8 text-center text-gray-400">No audit logs found</div>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium border-b w-40">Timestamp</th>
                                <th className="px-4 py-3 font-medium border-b w-32">Action</th>
                                <th className="px-4 py-3 font-medium border-b">Details</th>
                                <th className="px-4 py-3 font-medium border-b w-32">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.action === 'DELETE_USER' ? 'bg-red-100 text-red-800' :
                                                log.action === 'SQL_QUERY' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                        {formatDetails(log.details)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                        {log.ipAddress}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="p-3 border-t bg-gray-50 dark:bg-zinc-800 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                    Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchLogs(page - 1)}
                        disabled={page === 1 || loading}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => fetchLogs(page + 1)}
                        disabled={page === totalPages || loading}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
