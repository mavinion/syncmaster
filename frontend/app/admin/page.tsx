"use client";

import { useState } from 'react';
import LogsViewer from '@/components/admin/LogsViewer';
import DatabaseViewer from '@/components/admin/DatabaseViewer';
import DashboardStats from '@/components/admin/DashboardStats';
import ActivityChart from '@/components/admin/ActivityChart';
import UsersViewer from '@/components/admin/UsersViewer';
import SystemMonitor from '@/components/admin/SystemMonitor';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'database' | 'users' | 'audit'>('dashboard');

    const getTabClass = (tabName: string) => {
        return `px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tabName
                ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`;
    };

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
                            onClick={() => setActiveTab('dashboard')}
                            className={getTabClass('dashboard')}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={getTabClass('users')}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={getTabClass('audit')}
                        >
                            Audit
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={getTabClass('logs')}
                        >
                            System Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('database')}
                            className={getTabClass('database')}
                        >
                            Database
                        </button>
                    </div>
                </header>

                <main>
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <DashboardStats />
                            <SystemMonitor />
                            <ActivityChart />
                        </div>
                    )}
                    {activeTab === 'users' && <UsersViewer />}
                    {activeTab === 'logs' && <LogsViewer />}
                    {activeTab === 'database' && <DatabaseViewer />}
                    {activeTab === 'audit' && <AuditLogViewer />}
                </main>
            </div>
        </div>
    );
}
