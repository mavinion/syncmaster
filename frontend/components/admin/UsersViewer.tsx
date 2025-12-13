"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Search, Trash2, User, RefreshCw, X } from 'lucide-react';

interface UserData {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    _count: {
        syncLogs: number;
        accounts: number;
    };
}

export default function UsersViewer() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/users', {
                params: {
                    page,
                    limit: 10,
                    search: searchTerm
                }
            });
            setUsers(response.data.users);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300); // 300ms debounce for search
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm]);

    const handleDelete = async (userId: string) => {
        try {
            await axios.delete(`/api/admin/users/${userId}`);
            setDeleteConfirm(null);
            fetchUsers(); // Refresh list
        } catch (err) {
            console.error(err);
            setError('Failed to delete user');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
                <button
                    onClick={() => fetchUsers()}
                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    className="w-full pl-9 pr-4 py-2 border rounded-md bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Reset to page 1 on search
                    }}
                />
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                    {error}
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3">Accounts</th>
                                <th className="px-4 py-3">Logs</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{user.name || 'No Name'}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs font-medium">
                                                {user._count.accounts}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs font-medium">
                                                {user._count.syncLogs}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right relative">
                                            {deleteConfirm === user.id ? (
                                                <div className="flex items-center justify-end gap-2 absolute inset-0 bg-white dark:bg-zinc-900 px-4">
                                                    <span className="text-xs text-red-500 font-medium">Are you sure?</span>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                    >
                                                        Yes, Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                                                    >
                                                        <X className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(user.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center text-sm text-gray-500">
                <div>Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
