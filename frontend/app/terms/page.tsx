import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
                        <h1>Terms of Service</h1>
                        <p className="text-zinc-600 font-medium">Last Updated: 2025-11-30</p>

                        <h2>1. Acceptance of Terms</h2>
                        <p>By downloading, installing, or using SyncMaster ("the Software"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Software.</p>

                        <h2>2. License</h2>
                        <p>The Software is provided under the MIT License. You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the conditions stated in the <Link href="/license">License</Link>.</p>

                        <h2>3. Self-Hosted Nature</h2>
                        <p>SyncMaster is a self-hosted application. You are solely responsible for:</p>
                        <ul>
                            <li>Hosting and maintaining the infrastructure required to run the Software.</li>
                            <li>Securing your installation, including database access and environment variables.</li>
                            <li>Backing up your data.</li>
                        </ul>

                        <h2>4. Disclaimer of Warranty</h2>
                        <p className="uppercase font-bold text-xs tracking-wider text-zinc-500">AS STATED IN THE LICENSE:</p>
                        <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.</p>

                        <h2>5. No Guarantee of Data Integrity</h2>
                        <p>The authors of this Software do not guarantee the integrity of your data. Synchronization involves complex interactions between third-party services, and errors may occur. You acknowledge that you use this Software at your own risk and that you are solely responsible for maintaining backups of your data.</p>

                        <h2>6. Limitation of Liability</h2>
                        <p>IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>

                        <h2>7. Third-Party Services</h2>
                        <p>The Software interacts with Google Calendar and Apple iCloud. Your use of these services is governed by their respective Terms of Service and Privacy Policies. SyncMaster is not affiliated with, endorsed by, or sponsored by Google or Apple.</p>

                        <h2>8. Changes to Terms</h2>
                        <p>We reserve the right to modify these terms at any time. Your continued use of the Software following any changes indicates your acceptance of the new terms.</p>
                    </article>
                </div>
            </main>
        </div>
    );
}
