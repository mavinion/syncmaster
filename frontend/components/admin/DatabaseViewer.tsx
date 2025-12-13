import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Database, Table as TableIcon, Download, Terminal, ArrowLeft } from 'lucide-react';
import SqlConsole from '@/components/admin/SqlConsole';

export default function DatabaseViewer() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<any[]>([]);
    const [loadingTables, setLoadingTables] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'tables' | 'sql'>('tables');

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchTableData(selectedTable);
        } else {
            setTableData([]);
        }
    }, [selectedTable]);

    const fetchTables = async () => {
        setLoadingTables(true);
        try {
            const response = await axios.get('/api/admin/tables');
            setTables(response.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch tables');
        } finally {
            setLoadingTables(false);
        }
    };

    const fetchTableData = async (tableName: string) => {
        setLoadingData(true);
        try {
            const response = await axios.get(`/api/admin/tables/${tableName}`);
            setTableData(response.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(`Failed to fetch data for ${tableName}`);
        } finally {
            setLoadingData(false);
        }
    };

    const handleExport = (tableName: string) => {
        // Trigger download via browser navigation
        window.open(`/api/admin/tables/${tableName}/export`, '_blank');
    };

    if (viewMode === 'sql') {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('tables')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Tables
                    </button>
                    <span className="text-gray-300">|</span>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Terminal className="w-5 h-5" /> SQL Console
                    </h2>
                </div>
                <SqlConsole />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => setViewMode('sql')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded text-sm font-medium transition-colors"
                >
                    <Terminal className="w-4 h-4" />
                    Open SQL Console
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
                {/* Sidebar - Table List */}
                <div className="md:col-span-1 border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 flex flex-col">
                    <div className="p-3 bg-gray-50 dark:bg-zinc-800 border-b font-medium flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Tables
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {loadingTables ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            tables.map((table) => (
                                <button
                                    key={table}
                                    onClick={() => setSelectedTable(table)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${selectedTable === table
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <TableIcon className="w-3 h-3 opacity-50" />
                                    {table}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content - Table Data */}
                <div className="md:col-span-3 border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 flex flex-col">
                    <div className="p-3 bg-gray-50 dark:bg-zinc-800 border-b font-medium flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <TableIcon className="w-4 h-4" />
                            {selectedTable ? selectedTable : 'Select a table'}
                        </div>
                        {selectedTable && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                    {tableData.length} records
                                </span>
                                <button
                                    onClick={() => handleExport(selectedTable)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                    title="Export as CSV"
                                >
                                    <Download className="w-3 h-3" />
                                    Export
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto relative">
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 z-10">
                                <div className="text-red-500 bg-red-50 px-4 py-2 rounded border border-red-100">
                                    {error}
                                </div>
                            </div>
                        )}

                        {loadingData ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : !selectedTable ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Database className="w-12 h-12 mb-2 opacity-20" />
                                <p>Select a table to view its content</p>
                            </div>
                        ) : tableData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <p>No records found in this table</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {Object.keys(tableData[0]).map((header) => (
                                            <th key={header} className="px-4 py-2 border-b whitespace-nowrap font-medium text-xs uppercase tracking-wider">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                                    {tableData.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                            {Object.values(row).map((cell: any, j) => (
                                                <td key={j} className="px-4 py-2 border-b whitespace-nowrap max-w-xs truncate" title={typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}>
                                                    {typeof cell === 'object' && cell !== null
                                                        ? JSON.stringify(cell)
                                                        : String(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
