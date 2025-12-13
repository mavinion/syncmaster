"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Server, Cpu, Database, Activity } from 'lucide-react';

interface SystemStats {
    uptime: number;
    memory: {
        total: number;
        free: number;
        used: number;
    };
    cpu: {
        load: number[];
        cores: number;
    };
    os: {
        platform: string;
        release: string;
        type: string;
        arch: string;
    };
    nodeVersion: string;
    dbStatus: string;
}

export default function SystemMonitor() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/admin/system');
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch system stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);

        return parts.join(' ');
    };

    const formatBytes = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024)); // Changed parseInt to Math.floor for stricter typing inference if needed, but logic stands
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    if (loading && !stats) {
        return (
            <div className="flex justify-center p-8 bg-white dark:bg-zinc-900 border rounded-lg h-48 items-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                {error}
            </div>
        );
    }

    if (!stats) return null;

    const memUsagePercent = (stats.memory.used / stats.memory.total) * 100;

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Live
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Uptime */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Uptime</p>
                        <p className="font-mono font-semibold">{formatUptime(stats.uptime)}</p>
                    </div>
                </div>

                {/* Database */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg flex items-center gap-4">
                    <div className={`p-3 rounded-full ${stats.dbStatus === 'connected' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Database</p>
                        <p className="font-semibold capitalize flex items-center gap-2">
                            {stats.dbStatus}
                        </p>
                    </div>
                </div>

                {/* CPU Load */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">CPU (1m Load)</p>
                        <p className="font-mono font-semibold">{stats.cpu.load[0].toFixed(2)} / {stats.cpu.cores} Cores</p>
                    </div>
                </div>

                {/* Memory */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Memory</p>
                            <p className="font-semibold">{formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}</p>
                        </div>
                        <span className="text-xs font-mono">{memUsagePercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${memUsagePercent > 90 ? 'bg-red-500' : memUsagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${memUsagePercent}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-gray-400 flex justify-between font-mono">
                <span>Node {stats.nodeVersion}</span>
                <span>{stats.os.type} {stats.os.release} ({stats.os.arch})</span>
            </div>
        </div>
    );
}
