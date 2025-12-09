import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LicensePage() {
    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <RefreshCw className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-zinc-900">Calmesh</span>
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

                    <article className="prose prose-zinc max-w-none prose-headings:text-zinc-900 prose-p:text-zinc-800 prose-li:text-zinc-800 prose-strong:text-zinc-900">
                        <h1>License</h1>
                        <p className="text-zinc-600 font-medium">MIT License</p>

                        <div className="bg-zinc-50 p-6 rounded-lg border font-mono text-sm overflow-x-auto text-zinc-800">
                            <p>Copyright (c) 2025 Bjoern Konrad</p>

                            <p>Permission is hereby granted, free of charge, to any person obtaining a copy
                                of this software and associated documentation files (the "Software"), to deal
                                in the Software without restriction, including without limitation the rights
                                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                                copies of the Software, and to permit persons to whom the Software is
                                furnished to do so, subject to the following conditions:</p>

                            <p>The above copyright notice and this permission notice shall be included in all
                                copies or substantial portions of the Software.</p>

                            <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                                SOFTWARE.</p>
                        </div>
                    </article>
                </div>
            </main>
        </div>
    );
}
