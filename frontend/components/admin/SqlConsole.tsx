"use client";

import { useState } from 'react';
import axios from 'axios';
import { Play, AlertTriangle, Loader2 } from 'lucide-react';

export default function SqlConsole() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const executeQuery = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post('/api/admin/query', { query });
            setResult(response.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Query execution failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
            <div className="bg-white dark:bg-zinc-900 border rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        SQL Query
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Power User Tool
                        </span>
                    </label>
                    <button
                        onClick={executeQuery}
                        disabled={loading || !query.trim()}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Run Query
                    </button>
                </div>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SELECT * FROM &quot;User&quot; LIMIT 10;"
                    className="w-full h-32 p-3 font-mono text-sm border rounded bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    spellCheck={false}
                />
            </div>

            <div className="flex-1 bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden shadow-sm flex flex-col">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 border-b font-medium text-sm flex justify-between">
                    <span>Results</span>
                    {result && <span className="text-gray-500">{result.length} rows</span>}
                </div>

                <div className="flex-1 overflow-auto p-4 relative">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 font-mono text-sm">
                            {error}
                        </div>
                    )}

                    {!result && !error && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p>Enter a query and hit Run to see results</p>
                        </div>
                    )}

                    {result && result.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <p>Query executed successfully. No rows returned.</p>
                        </div>
                    )}

                    {result && result.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 sticky top-0">
                                    <tr>
                                        {Object.keys(result[0]).map((header) => (
                                            <th key={header} className="px-4 py-2 border-b whitespace-nowrap font-medium text-xs uppercase tracking-wider">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700 font-mono text-xs">
                                    {result.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                            {Object.values(row).map((cell: any, j) => (
                                                <td key={j} className="px-4 py-2 border-b whitespace-nowrap max-w-xs truncate" title={String(cell)}>
                                                    {String(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
