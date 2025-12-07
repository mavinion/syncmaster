import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';

interface Calendar {
    id: string;
    summary: string;
    syncEnabled: boolean;
    syncDirection: 'BIDIRECTIONAL' | 'GOOGLE_TO_APPLE' | 'APPLE_TO_GOOGLE';
}

interface CalendarList {
    google: Calendar[];
    apple: Calendar[];
    autoSyncEnabled: boolean;
}

export function CalendarSelector({ userId }: { userId: string }) {
    const [calendars, setCalendars] = useState<CalendarList | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoSync, setAutoSync] = useState(false);

    useEffect(() => {
        fetchCalendars();
    }, [userId]);

    const fetchCalendars = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/calendars/list?userId=${userId}`);
            console.log('Fetched calendars:', res.data);
            setCalendars(res.data);
            setAutoSync(res.data.autoSyncEnabled);
        } catch (error) {
            console.error('Failed to fetch calendars', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCalendarPreference = (provider: 'google' | 'apple', calendar: Calendar, updates: Partial<Calendar>) => {
        const otherProvider = provider === 'google' ? 'apple' : 'google';

        setCalendars(prev => {
            if (!prev) return null;

            // Update the modified calendar
            const updatedProviderList = prev[provider].map(c =>
                c.id === calendar.id ? { ...c, ...updates } : c
            );

            // Update the matching calendar in the other list (by name)
            // We also sync the direction and enabled state to keep them consistent visually
            const updatedOtherList = prev[otherProvider].map(c =>
                c.summary === calendar.summary ? { ...c, ...updates } : c
            );

            return {
                ...prev,
                [provider]: updatedProviderList,
                [otherProvider]: updatedOtherList
            };
        });
    };

    const handleAutoSyncToggle = async () => {
        const newState = !autoSync;
        setAutoSync(newState);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/calendars/preferences/auto-sync`, {
                userId,
                enabled: newState
            });
        } catch (error) {
            console.error('Failed to update auto-sync preference', error);
            setAutoSync(!newState); // Revert on error
        }
    };

    const handleSave = async () => {
        if (!calendars) return;
        setLoading(true);
        try {
            // Save Google Calendars
            for (const cal of calendars.google) {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/calendars/preferences`, {
                    userId,
                    googleCalendarId: cal.id,
                    displayName: cal.summary,
                    enabled: cal.syncEnabled,
                    syncDirection: cal.syncDirection
                });
            }

            // Save Apple Calendars
            for (const cal of calendars.apple) {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/calendars/preferences`, {
                    userId,
                    appleCalendarUrl: cal.id,
                    displayName: cal.summary,
                    enabled: cal.syncEnabled,
                    syncDirection: cal.syncDirection
                });
            }

            // Trigger Sync
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/sync/trigger`, { userId });

            alert('Preferences saved and sync started!');
        } catch (error) {
            console.error('Failed to save preferences', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setLoading(false);
            fetchCalendars(); // Refresh to get latest state
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    }

    if (!calendars) return null;

    return (
        <div className="space-y-6 mt-8">
            {/* Auto Sync Toggle */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-medium text-zinc-900">Automatic Synchronization</h3>
                            <p className="text-sm text-zinc-500">Automatically sync calendars every 15 minutes</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-700">
                                {autoSync ? 'On' : 'Off'}
                            </span>
                            <button
                                onClick={handleAutoSyncToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${autoSync ? 'bg-blue-600' : 'bg-zinc-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sync Information */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900 space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    Sync Options & Behavior
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-1 text-blue-800">
                    <li><strong>Bidirectional:</strong> Events are synchronized in both directions. Changes on either side are propagated.</li>
                    <li><strong>One-Way:</strong> Events are copied from the source to the target only.</li>
                    <li><strong>Calendar Creation:</strong> If you enable sync for a calendar and it doesn't exist on the other side, a new calendar with the same name will be <strong>automatically created</strong>.</li>
                </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            Google Calendars
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {calendars.google.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">No calendars found.</p>
                        ) : (
                            calendars.google.map(cal => (
                                <div key={cal.id} className="flex items-center justify-between p-2 border rounded hover:bg-zinc-50">
                                    <span className="font-medium">{cal.summary}</span>
                                    <select
                                        value={cal.syncEnabled ? cal.syncDirection : 'DISABLED'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'DISABLED') {
                                                updateCalendarPreference('google', cal, { syncEnabled: false });
                                            } else {
                                                updateCalendarPreference('google', cal, {
                                                    syncEnabled: true,
                                                    syncDirection: val as any
                                                });
                                            }
                                        }}
                                        className="text-sm border rounded p-1"
                                    >
                                        <option value="DISABLED">Disabled</option>
                                        <option value="BIDIRECTIONAL">Bidirectional</option>
                                        <option value="GOOGLE_TO_APPLE">Send to Apple</option>
                                        <option value="APPLE_TO_GOOGLE">Receive from Apple</option>
                                    </select>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            Apple Calendars
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {calendars.apple.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">No calendars found.</p>
                        ) : (
                            calendars.apple.map(cal => (
                                <div key={cal.id} className="flex items-center justify-between p-2 border rounded hover:bg-zinc-50">
                                    <span className="font-medium">{cal.summary}</span>
                                    <select
                                        value={cal.syncEnabled ? cal.syncDirection : 'DISABLED'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'DISABLED') {
                                                updateCalendarPreference('apple', cal, { syncEnabled: false });
                                            } else {
                                                updateCalendarPreference('apple', cal, {
                                                    syncEnabled: true,
                                                    syncDirection: val as any
                                                });
                                            }
                                        }}
                                        className="text-sm border rounded p-1"
                                    >
                                        <option value="DISABLED">Disabled</option>
                                        <option value="BIDIRECTIONAL">Bidirectional</option>
                                        <option value="APPLE_TO_GOOGLE">Send to Google</option>
                                        <option value="GOOGLE_TO_APPLE">Receive from Google</option>
                                    </select>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                    Save & Sync
                </button>
            </div>
        </div>
    );
}
