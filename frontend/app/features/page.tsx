import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Shield, Calendar, Settings, Lock, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-zinc-900">Calmesh</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="py-12 px-4">
                <div className="max-w-4xl mx-auto space-y-12">

                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Home
                        </Link>
                        <h1 className="text-4xl font-extrabold text-zinc-900">Detailed Features</h1>
                        <p className="text-xl text-zinc-500">
                            Explore the comprehensive capabilities of Calmesh.
                        </p>
                    </div>

                    <div className="grid gap-8">

                        {/* Core Synchronization */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-blue-600">
                                <RefreshCw className="w-6 h-6" />
                                <h2 className="text-2xl font-bold text-zinc-900">Core Synchronization</h2>
                            </div>
                            <Card>
                                <CardContent className="pt-6 grid gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Bidirectional Sync</h3>
                                        <p className="text-zinc-600">Seamlessly sync events between Google Calendar and Apple Calendar (iCloud) in both directions. Changes made on one platform appear on the other instantly.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">One-Way Sync</h3>
                                        <p className="text-zinc-600">Configure sync direction per calendar:</p>
                                        <ul className="list-disc list-inside ml-2 text-zinc-600 mt-1">
                                            <li><strong>Google to Apple:</strong> Changes in Google propagate to Apple.</li>
                                            <li><strong>Apple to Google:</strong> Changes in Apple propagate to Google.</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Conflict Resolution</h3>
                                        <p className="text-zinc-600">Intelligent handling of simultaneous edits using ETags and timestamps to prevent data loss and ensure the latest version is preserved.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Automatic & Manual Sync</h3>
                                        <p className="text-zinc-600">Background jobs run every 15 minutes to keep calendars in sync automatically. You can also trigger an immediate sync manually from the dashboard.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Account Management */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-purple-600">
                                <Settings className="w-6 h-6" />
                                <h2 className="text-2xl font-bold text-zinc-900">Account Management</h2>
                            </div>
                            <Card>
                                <CardContent className="pt-6 grid gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Secure Integration</h3>
                                        <p className="text-zinc-600">Uses standard OAuth 2.0 for Google and secure App-Specific Passwords (CalDAV) for Apple iCloud connections.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Multi-User Support</h3>
                                        <p className="text-zinc-600">The platform supports multiple users, each with their own isolated set of linked accounts and calendars.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Calendar Management */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-green-600">
                                <Calendar className="w-6 h-6" />
                                <h2 className="text-2xl font-bold text-zinc-900">Calendar Management</h2>
                            </div>
                            <Card>
                                <CardContent className="pt-6 grid gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Granular Control</h3>
                                        <p className="text-zinc-600">Select exactly which calendars you want to sync. You don't have to sync everything.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Auto-Creation</h3>
                                        <p className="text-zinc-600">Automatically creates missing calendars on the target platform to match the source, ensuring your setup is mirrored perfectly.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Event Fidelity */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-orange-600">
                                <Activity className="w-6 h-6" />
                                <h2 className="text-2xl font-bold text-zinc-900">Event Fidelity</h2>
                            </div>
                            <Card>
                                <CardContent className="pt-6 grid gap-4">
                                    <p className="text-zinc-600">We sync all major event details to ensure your schedule is accurate:</p>
                                    <ul className="grid sm:grid-cols-2 gap-2 text-zinc-700">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Title & Description</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Start & End Times</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Time Zones</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Location</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Recurrence Rules</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>Reminders / Alarms</li>
                                    </ul>
                                    <div className="mt-2">
                                        <h3 className="font-bold text-zinc-900">Deletions</h3>
                                        <p className="text-zinc-600">Event cancellations and deletions are correctly propagated across platforms.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Privacy & Security */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-red-600">
                                <Lock className="w-6 h-6" />
                                <h2 className="text-2xl font-bold text-zinc-900">Privacy & Security</h2>
                            </div>
                            <Card>
                                <CardContent className="pt-6 grid gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Self-Hosted</h3>
                                        <p className="text-zinc-600">Designed to be hosted on your own infrastructure via Docker. You own your data.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Encryption</h3>
                                        <p className="text-zinc-600">Sensitive credentials (access tokens, refresh tokens, app passwords) are encrypted at rest using AES-256-CBC.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Local Data</h3>
                                        <p className="text-zinc-600">All data is stored locally in your PostgreSQL database. No external analytics or tracking services are used.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Monitoring */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-zinc-600">
                                <Shield className="w-6 h-6" />
                                <h2 className="text-2xl font-bold text-zinc-900">Monitoring & Admin</h2>
                            </div>
                            <Card>
                                <CardContent className="pt-6 grid gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-900">User Dashboard</h3>
                                        <p className="text-zinc-600">View connection status, configure sync rules, and monitor sync history in real-time.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Detailed Logs</h3>
                                        <p className="text-zinc-600">Inspect detailed logs of every sync action (Create, Update, Delete, Link) to verify everything is working correctly.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                    </div>

                    <div className="text-center pt-8">
                        <Link href="/login">
                            <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg">
                                Start Syncing Now
                            </Button>
                        </Link>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-900 text-zinc-400 py-12 px-4 mt-12">
                <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-white">
                            <RefreshCw className="w-6 h-6" />
                            <span className="font-bold text-xl">Calmesh</span>
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
                            <li><Link href="https://github.com/bjoernkonrad/GoogleAppleSync" className="hover:text-white">GitHub</Link></li>
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
                    © {new Date().getFullYear()} Calmesh. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
