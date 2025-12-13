"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, AlertTriangle, Loader2 } from 'lucide-react';

export default function DashboardStats() {
    const [stats, setStats] = useState<{
        totalUsers: number;
        totalLogs: number;
        errorCount: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/admin/stats');
                setStats(response.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                {error}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats?.totalUsers.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logs</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats?.totalLogs.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
                        <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Logs (Total)</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats?.errorCount.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}
