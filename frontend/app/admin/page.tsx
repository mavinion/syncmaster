"use client";

import { useState } from 'react';
import LogsViewer from '@/components/admin/LogsViewer';
import DatabaseViewer from '@/components/admin/DatabaseViewer';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'database'>('logs');

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">System monitoring and database management</p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-1 rounded-lg border shadow-sm inline-flex">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'logs'
                                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            System Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('database')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'database'
                                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Database
                        </button>
                    </div>
                </header>

                <main>
                    {activeTab === 'logs' ? <LogsViewer /> : <DatabaseViewer />}
                </main>
            </div>
        </div>
    );
}
