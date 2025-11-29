import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';

interface Calendar {
    id: string;
    summary: string;
    syncEnabled: boolean;
}

interface CalendarList {
    google: Calendar[];
    apple: Calendar[];
}

export function CalendarSelector({ userId }: { userId: string }) {
    const [calendars, setCalendars] = useState<CalendarList | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalendars();
    }, [userId]);

    const fetchCalendars = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/calendars/list?userId=${userId}`);
            setCalendars(res.data);
        } catch (error) {
            console.error('Failed to fetch calendars', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCalendar = (provider: 'google' | 'apple', calendar: Calendar) => {
        const newEnabled = !calendar.syncEnabled;
        const otherProvider = provider === 'google' ? 'apple' : 'google';

        setCalendars(prev => {
            if (!prev) return null;

            // Update the clicked calendar
            const updatedProviderList = prev[provider].map(c =>
                c.id === calendar.id ? { ...c, syncEnabled: newEnabled } : c
            );

            // Update the matching calendar in the other list (by name)
            const updatedOtherList = prev[otherProvider].map(c =>
                c.summary === calendar.summary ? { ...c, syncEnabled: newEnabled } : c
            );

            return {
                ...prev,
                [provider]: updatedProviderList,
                [otherProvider]: updatedOtherList
            };
        });
    };

    const handleSave = async () => {
        if (!calendars) return;
        setLoading(true);
        try {
            // Save Google Calendars
            for (const cal of calendars.google) {
                await axios.post('http://localhost:3000/calendars/preferences', {
                    userId,
                    googleCalendarId: cal.id,
                    displayName: cal.summary,
                    enabled: cal.syncEnabled
                });
            }

            // Save Apple Calendars
            for (const cal of calendars.apple) {
                await axios.post('http://localhost:3000/calendars/preferences', {
                    userId,
                    appleCalendarUrl: cal.id,
                    displayName: cal.summary,
                    enabled: cal.syncEnabled
                });
            }

            // Trigger Sync
            await axios.post('http://localhost:3000/sync/trigger', { userId });

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
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            Google Calendars
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {calendars.google.map(cal => (
                            <div key={cal.id} className="flex items-center justify-between p-2 border rounded hover:bg-zinc-50">
                                <span className="font-medium">{cal.summary}</span>
                                <input
                                    type="checkbox"
                                    checked={cal.syncEnabled}
                                    onChange={() => toggleCalendar('google', cal)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                        ))}
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
                        {calendars.apple.map(cal => (
                            <div key={cal.id} className="flex items-center justify-between p-2 border rounded hover:bg-zinc-50">
                                <span className="font-medium">{cal.summary}</span>
                                <input
                                    type="checkbox"
                                    checked={cal.syncEnabled}
                                    onChange={() => toggleCalendar('apple', cal)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                        ))}
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
