"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface Log {
    id: string;
    level: string;
    message: string;
    details: string | null;
    source: string;
    createdAt: string;
    user: {
        email: string;
        name: string | null;
    } | null;
}

export default function LogsViewer() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterLevel, setFilterLevel] = useState<string>('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterLevel) params.level = filterLevel;

            // Use API proxy
            const response = await axios.get('/api/admin/logs', { params });
            setLogs(response.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filterLevel]);

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'WARN': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">System Logs</h2>
                <div className="flex gap-2">
                    <select
                        className="border rounded px-2 py-1 bg-white dark:bg-zinc-800"
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                    >
                        <option value="">All Levels</option>
                        <option value="ERROR">Error</option>
                        <option value="WARN">Warning</option>
                        <option value="INFO">Info</option>
                        <option value="SUCCESS">Success</option>
                    </select>
                    <button
                        onClick={fetchLogs}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Level</th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Message</th>
                                    <th className="px-4 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getLevelIcon(log.level)}
                                                <span className="font-medium">{log.level}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs">
                                                {log.source}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {log.user ? (
                                                <div className="flex flex-col">
                                                    <span>{log.user.name || 'Unknown'}</span>
                                                    <span className="text-xs text-gray-400">{log.user.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {log.message}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={log.details || ''}>
                                            {log.details || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                            No logs found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
