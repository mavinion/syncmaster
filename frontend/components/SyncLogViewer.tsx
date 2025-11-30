import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Info, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface SyncLog {
    id: string;
    level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN';
    message: string;
    details?: string;
    source: 'MANUAL' | 'AUTO';
    createdAt: string;
}

export function SyncLogViewer({ userId }: { userId: string }) {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/sync/logs?userId=${userId}`);
            setLogs(res.data);
        } catch (error) {
            console.error('Failed to fetch sync logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [userId]);

    const getIcon = (level: string) => {
        switch (level) {
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'WARN': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString();
    };

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Sync History</CardTitle>
                <button
                    onClick={() => { setLoading(true); fetchLogs(); }}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] pr-4 overflow-y-auto">
                    <div className="space-y-2">
                        {logs.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic text-center py-4">No logs found.</p>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="border rounded-lg p-3 text-sm hover:bg-zinc-50 transition-colors">
                                    <div
                                        className="flex items-start gap-3 cursor-pointer"
                                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                    >
                                        <div className="mt-0.5">{getIcon(log.level)}</div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-zinc-900">{log.message}</span>
                                                <span className="text-xs text-zinc-400 font-mono">{formatTime(log.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${log.source === 'AUTO' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {log.source}
                                                </span>
                                                {log.details && (
                                                    <span className="flex items-center gap-1 text-blue-600 hover:underline">
                                                        {expandedLogId === log.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        Details
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedLogId === log.id && log.details && (
                                        <div className="mt-3 ml-7 p-2 bg-zinc-100 rounded text-xs font-mono overflow-x-auto">
                                            {(() => {
                                                try {
                                                    const parsed = JSON.parse(log.details);
                                                    if (Array.isArray(parsed)) {
                                                        return (
                                                            <ul className="space-y-1">
                                                                {parsed.map((item, i) => (
                                                                    <li key={i} className={`${item.startsWith('[Error]') ? 'text-red-600' : 'text-zinc-700'}`}>
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        );
                                                    }
                                                    return <pre>{JSON.stringify(parsed, null, 2)}</pre>;
                                                } catch (e) {
                                                    return <pre>{log.details}</pre>;
                                                }
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
