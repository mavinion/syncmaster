import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Calendar, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-zinc-900">SyncMaster</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-600 hover:text-zinc-900">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Now with Bidirectional Sync
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-900 tracking-tight">
            Sync your Google & <br />
            <span className="text-blue-600">Apple Calendars</span> seamlessly.
          </h1>

          <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Stop juggling multiple calendars. SyncMaster keeps your schedule perfectly synchronized across all your devices and accounts in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                Start Syncing Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="pt-12 flex items-center justify-center gap-8 text-sm text-zinc-400 grayscale opacity-70">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /></svg>
              Google Calendar
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.37-1.62 1.71.12 2.99.84 3.76 2.07-3.18 1.87-2.66 5.86.34 7.1-.64 1.54-1.44 3.08-2.54 4.68h-.01zM13 5.08c-.66 1.63-2.73 2.9-4.5 2.65-.34-1.58.9-3.22 2.36-4.14 1.24-.78 3.12-1.05 2.14 1.49z" /></svg>
              Apple Calendar
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">Everything you need to stay organized</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Powerful features designed to make calendar management effortless and reliable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Bidirectional Sync</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Changes made on Google Calendar reflect on Apple Calendar instantly, and vice versa. Never miss an update.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center text-green-600">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Privacy First</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Your data stays yours. We store minimal data locally and encrypt all credentials. No external analytics or tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center text-purple-600">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Real-time Updates</h3>
                <p className="text-zinc-500 leading-relaxed">
                  Background workers ensure your calendars are always up to date. Set it once and forget it.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link href="/features">
              <Button variant="outline" className="gap-2">
                View All Features
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">How it works</h2>
            <p className="text-zinc-500">Get up and running in less than 2 minutes.</p>
          </div>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white border rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Connect Google Account</h3>
                <p className="text-zinc-500">Sign in securely with your Google account to grant access to your calendars.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white border rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Connect Apple ID</h3>
                <p className="text-zinc-500">Use an App-Specific Password to securely connect your iCloud calendars.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-white border rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Select & Sync</h3>
                <p className="text-zinc-500">Choose which calendars to sync and in which direction. We handle the rest.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to synchronize your life?</h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Join thousands of users who trust SyncMaster to keep their schedules in check. Open source, secure, and free to self-host.
          </p>
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-blue-50 rounded-full font-bold shadow-lg">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-4">
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
              <li><Link href="#features" className="hover:text-white">Features</Link></li>
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
          © {new Date().getFullYear()} SyncMaster. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
