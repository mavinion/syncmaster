"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Activity } from 'lucide-react';

export default function ActivityChart() {
    const [data, setData] = useState<{ date: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await axios.get('/api/admin/activity');
                setData(response.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch activity data');
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8 bg-white dark:bg-zinc-900 border rounded-lg h-64 items-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 h-64 flex items-center justify-center">
                {error}
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count), 1); // Prevent division by zero

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity (Last 7 Days)</h3>
            </div>

            <div className="h-64 flex items-end justify-between gap-2">
                {data.map((item) => {
                    const heightPercent = (item.count / maxCount) * 100;
                    return (
                        <div key={item.date} className="flex flex-col items-center flex-1 group">
                            <div className="relative w-full flex items-end justify-center h-full">
                                <div
                                    className="w-full bg-blue-500/80 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-t transition-all duration-300 min-h-[4px]"
                                    style={{ height: `${heightPercent}%` }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        {item.count} logs
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center truncate w-full">
                                {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
