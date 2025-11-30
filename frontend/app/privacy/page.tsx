import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-zinc-900">SyncMaster</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="py-12 px-4">
                <div className="max-w-3xl mx-auto space-y-8">
                    <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Home
                    </Link>

                    <article className="prose prose-zinc max-w-none [&_h1]:text-zinc-900 [&_h2]:text-zinc-900 [&_p]:text-zinc-800 [&_li]:text-zinc-800 [&_strong]:text-zinc-900">
                        <h1>Privacy Policy</h1>
                        <p className="text-zinc-600 font-medium">Last Updated: 2025-11-30</p>

                        <h2>1. Introduction</h2>
                        <p>This application ("SyncMaster") is a self-hosted synchronization tool designed to sync calendar events between Google Calendar and Apple Calendar. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how data is handled within the application.</p>

                        <h2>2. Data We Collect and Store</h2>
                        <p>This application stores the following data in your local PostgreSQL database:</p>
                        <ul>
                            <li><strong>Authentication Tokens</strong>: OAuth2 access and refresh tokens for Google Calendar, and app-specific passwords for Apple Calendar. These are stored encrypted in the database.</li>
                            <li><strong>Calendar Events</strong>: Metadata about synchronized events (e.g., Event IDs, ETags, Sync Status) to facilitate the synchronization process.</li>
                            <li><strong>Sync Logs</strong>: Logs of synchronization activities, including success/failure status and error messages. <strong>Note:</strong> We strive to minimize PII in logs, but some event identifiers may be present for debugging purposes.</li>
                        </ul>

                        <h2>3. How We Use Your Data</h2>
                        <p>The data collected is used solely for the purpose of:</p>
                        <ul>
                            <li>Authenticating with Google and Apple services on your behalf.</li>
                            <li>Synchronizing calendar events between your connected accounts.</li>
                            <li>Providing you with a history of synchronization activities.</li>
                        </ul>

                        <h2>4. Data Storage and Security</h2>
                        <ul>
                            <li><strong>Local Storage</strong>: All data is stored locally on your server (or the server where you host this application) in a PostgreSQL database.</li>
                            <li><strong>Encryption</strong>: Sensitive authentication tokens are encrypted at rest using AES-256-CBC encryption.</li>
                            <li><strong>No External Analytics</strong>: This application does not send any data to third-party analytics services or telemetry servers.</li>
                        </ul>

                        <h2>5. Your Rights (GDPR)</h2>
                        <p>As this is a self-hosted application, you are the data controller. You have full control over your data:</p>
                        <ul>
                            <li><strong>Access</strong>: You can view all stored data by inspecting the PostgreSQL database.</li>
                            <li><strong>Rectification</strong>: You can update your account settings and credentials via the application interface.</li>
                            <li><strong>Erasure</strong>: You can delete your account and all associated data from the database at any time.</li>
                            <li><strong>Portability</strong>: You can export your data directly from the PostgreSQL database.</li>
                        </ul>

                        <h2>6. Third-Party Services</h2>
                        <p>This application interacts with the following third-party services:</p>
                        <ul>
                            <li><strong>Google Calendar API</strong>: To read and write events to your Google Calendar. Please refer to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</li>
                            <li><strong>Apple iCloud (CalDAV)</strong>: To read and write events to your Apple Calendar. Please refer to <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple's Privacy Policy</a>.</li>
                        </ul>

                        <h2>7. Contact</h2>
                        <p>If you have questions about this Privacy Policy or the application's data handling, please contact the repository maintainer.</p>
                    </article>
                </div>
            </main>
        </div>
    );
}
