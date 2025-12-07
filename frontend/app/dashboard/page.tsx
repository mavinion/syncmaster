'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import axios from 'axios';
import { SyncLogViewer } from '@/components/SyncLogViewer';
import { CalendarSelector } from '@/components/CalendarSelector'; // Assuming CalendarSelector is also a component

// ... (existing imports)

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [appleId, setAppleId] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const [appleConnected, setAppleConnected] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        const storedToken = localStorage.getItem('auth_token');
        let currentToken = null;

        if (urlToken) {
            localStorage.setItem('auth_token', urlToken);
            setToken(urlToken);
            currentToken = urlToken;
            router.replace('/dashboard');
        } else if (storedToken) {
            setToken(storedToken);
            currentToken = storedToken;
        } else {
            router.push('/');
        }

        // Fetch status if we have a token
        if (currentToken) {
            try {
                const payload = JSON.parse(atob(currentToken.split('.')[1]));
                axios.get(`http://localhost:3000/auth/status?userId=${payload.id}`)
                    .then(res => {
                        setAppleConnected(res.data.apple);
                    })
                    .catch(console.error);
            } catch (e) {
                console.error('Invalid token');
            }
        }
    }, [searchParams, router]);

    const handleAppleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        try {
            const payload = JSON.parse(atob(token!.split('.')[1]));

            await axios.post('http://localhost:3000/auth/apple-credentials', {
                userId: payload.id,
                appleId,
                appSpecificPassword: appPassword
            });

            setStatus('success');
            setAppleConnected(true); // Update UI immediately
            setAppleId('');
            setAppPassword('');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setErrorMessage(error.response?.data?.error || 'Failed to connect. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        router.push('/');
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <div className="flex-1 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <RefreshCw className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-900">SyncMaster Dashboard</h1>
                        </div>
                        <Button variant="ghost" onClick={handleLogout} className="gap-2">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                    </header>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <h3 className="font-bold text-amber-900">Important: Backup Your Data</h3>
                            <p className="text-sm text-amber-800">
                                Before syncing for the first time, we strongly recommend creating a backup of your Google and Apple calendars.
                                While we take every precaution, software bugs can happen. You are responsible for your own data.
                            </p>
                            <div className="flex gap-4 text-sm">
                                <a
                                    href="https://support.google.com/calendar/answer/37111"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-900 underline hover:text-amber-700 font-medium"
                                >
                                    How to backup Google Calendar
                                </a>
                                <a
                                    href="https://support.apple.com/guide/calendar/export-and-archive-calendars-icl1023/mac"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-900 underline hover:text-amber-700 font-medium"
                                >
                                    How to backup Apple Calendar
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Google Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google Calendar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Connected</span>
                                </div>
                                <p className="mt-4 text-sm text-zinc-500">
                                    Your Google Calendar is connected and ready to sync.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Apple Connect */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.37-1.62 1.71.12 2.99.84 3.76 2.07-3.18 1.87-2.66 5.86.34 7.1-.64 1.54-1.44 3.08-2.54 4.68h-.01zM13 5.08c-.66 1.63-2.73 2.9-4.5 2.65-.34-1.58.9-3.22 2.36-4.14 1.24-.78 3.12-1.05 2.14 1.49z" />
                                    </svg>
                                    Apple Calendar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {appleConnected ? (
                                    <>
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">Connected</span>
                                        </div>
                                        <p className="mt-4 text-sm text-zinc-500">
                                            Your Apple Calendar is connected and ready to sync.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setAppleConnected(false)}
                                            className="mt-4 w-full text-zinc-600"
                                        >
                                            Reconnect / Change Account
                                        </Button>
                                    </>
                                ) : (
                                    <form onSubmit={handleAppleConnect} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-700">Apple ID</label>
                                            <input
                                                type="email"
                                                required
                                                value={appleId}
                                                onChange={(e) => setAppleId(e.target.value)}
                                                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="name@icloud.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-700">App-Specific Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={appPassword}
                                                onChange={(e) => setAppPassword(e.target.value)}
                                                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="xxxx-xxxx-xxxx-xxxx"
                                            />
                                            <p className="text-xs text-zinc-500">
                                                Generate this at appleid.apple.com
                                            </p>
                                        </div>

                                        {status === 'error' && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <AlertCircle className="w-4 h-4" />
                                                {errorMessage}
                                            </div>
                                        )}

                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? 'Connecting...' : 'Connect Apple Calendar'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar Selection */}
                    {token && (
                        <>
                            <CalendarSelector userId={JSON.parse(atob(token.split('.')[1])).id} />
                            <SyncLogViewer userId={JSON.parse(atob(token.split('.')[1])).id} />
                        </>
                    )}

                    <div className="flex justify-center mt-8">
                        <Button
                            onClick={async () => {
                                try {
                                    const payload = JSON.parse(atob(token!.split('.')[1]));
                                    await axios.post('http://localhost:3000/sync/trigger', { userId: payload.id });
                                    alert('Sync started! Check backend logs for details.');
                                } catch (err) {
                                    console.error(err);
                                    alert('Failed to start sync');
                                }
                            }}
                            className="bg-zinc-900 text-white hover:bg-zinc-800"
                        >
                            Sync Now
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-zinc-900 text-zinc-400 py-12 px-4 mt-auto">
                <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-white">
                            <RefreshCw className="w-6 h-6" />
                            <span className="font-bold text-xl">SyncMaster</span>
                        </div>
                        <p className="text-sm max-w-xs">
                            The best way to sync Google and Apple calendars. Built for privacy, speed, and reliability.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/features" className="hover:text-white">Features</Link></li>
                            <li><Link href="/login" className="hover:text-white">Login</Link></li>
                            <li><Link href="https://github.com/mavinion/syncmaster" className="hover:text-white">GitHub</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                            <li><Link href="/license" className="hover:text-white">License</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto pt-8 border-t border-zinc-800 text-sm text-center md:text-left">
                    © {new Date().getFullYear()} SyncMaster. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
