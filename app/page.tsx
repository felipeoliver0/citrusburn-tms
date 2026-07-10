import Link from 'next/link';
import { ArrowRight, Truck, Map, BarChart3, ShieldCheck, Zap, Star, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-gray-50 text-gray-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* Background Decorators */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-amber-200/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-400/20 rounded-full blur-[120px] pointer-events-none animate-float" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-orange-300/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl w-full mx-auto animate-fade-in glass-panel rounded-b-3xl mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 transform hover:rotate-12 transition-transform duration-300">
            <Truck className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900">America Dispatch</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-brand-600 transition-colors">
            Log in
          </Link>
          <Link href="/register" className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-4 pt-12 pb-24">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-brand-200 bg-white/60 backdrop-blur-md text-brand-700 text-sm font-bold shadow-sm mb-8 animate-fade-in-up hover:shadow-md hover:border-brand-300 transition-all cursor-default" style={{ animationDelay: '0.1s' }}>
          <Zap className="w-4 h-4 fill-brand-500 text-brand-500 animate-pulse" />
          <span>The #1 TMS for Modern Logistics</span>
        </div>

        <h1 className="max-w-5xl text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05] text-gray-900 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Move freight faster. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500">
            Grow revenue seamlessly.
          </span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-gray-500 mb-10 font-medium animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.3s' }}>
          Connect Brokers, Carriers, and Drivers in one intelligent platform.
          Stop chasing paperwork and start scaling your transport empire today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link href="/register" className="group flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-amber-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand-500/30 hover:shadow-2xl hover:shadow-brand-500/40 hover:-translate-y-1 transition-all">
            Start for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="#pricing" className="flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:border-brand-300 hover:shadow-md transition-all">
            View Pricing
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Everything you need to run the road</h2>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">Built by industry veterans, America Dispatch provides all the tools you need to dispatch, track, and bill without the headache.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Map className="w-7 h-7 text-brand-600" />}
            title="Smart Loadboard"
            description="Find premium loads instantly. Our intelligent matching system connects Carriers with the right Brokers in seconds."
            bg="bg-brand-50"
            border="border-brand-100"
            glow="group-hover:shadow-brand-500/20"
          />
          <FeatureCard
            icon={<Truck className="w-7 h-7 text-emerald-600" />}
            title="Driver Tracking"
            description="Real-time GPS updates, vehicle inspections, and status management. Know where your fleet is 24/7."
            bg="bg-emerald-50"
            border="border-emerald-100"
            glow="group-hover:shadow-emerald-500/20"
          />
          <FeatureCard
            icon={<BarChart3 className="w-7 h-7 text-amber-600" />}
            title="Analytics & Invoicing"
            description="Beautiful charts that show exactly how much you're making, plus one-click PDF invoice and BOL generation for every load."
            bg="bg-amber-50"
            border="border-amber-100"
            glow="group-hover:shadow-amber-500/20"
          />
        </div>
      </section>

      {/* Founding Carrier Program */}
      <section className="bg-gray-900 text-white py-24 relative z-10 overflow-hidden rounded-3xl mx-4 lg:mx-8 mb-24 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-5xl bg-brand-500/20 blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-bold mb-6">
              <Zap className="w-4 h-4" />
              <span>Founding Carrier Program</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Built for the road, not a boardroom</h2>
            <p className="text-lg text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
              We&apos;re a new platform built by people who understand car hauling. No call centers, no seat traps — just modern tools and direct support from the people who built it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
              <ShieldCheck className="w-8 h-8 text-brand-400 mb-4" />
              <h3 className="font-bold text-white text-lg mb-2">No Seat Traps</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Pay only for active drivers. Cancel anytime, no long-term contracts.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
              <Zap className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="font-bold text-white text-lg mb-2">Direct Support</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Talk directly to our team — we read every message and ship fixes fast.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors duration-300">
              <Star className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="font-bold text-white text-lg mb-2">Early Access Pricing</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Join now and lock in founding-member rates as we grow the platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 pb-32 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Pay only for the drivers you manage. Shippers join for free.</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Shipper Plan */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-[2.5rem] p-10 shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Shippers</h3>
              <div className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Free<span className="text-xl text-gray-400 font-bold">/forever</span></div>
              <p className="text-gray-500 font-medium">Post loads and find carriers at zero cost.</p>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-center gap-4 font-bold text-gray-700"><CheckCircle2 className="w-6 h-6 text-brand-500" /> Unlimited Load Posts</li>
              <li className="flex items-center gap-4 font-bold text-gray-700"><CheckCircle2 className="w-6 h-6 text-brand-500" /> Carrier Verification</li>
              <li className="flex items-center gap-4 font-bold text-gray-700"><CheckCircle2 className="w-6 h-6 text-brand-500" /> Volume Analytics Dashboard</li>
            </ul>
            <Link href="/register" className="w-full text-center bg-gray-100 text-gray-900 font-black py-4 rounded-2xl hover:bg-gray-200 transition-colors">
              Create Shipper Account
            </Link>
          </div>

          {/* Carrier Plan */}
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl relative flex flex-col transform md:scale-105 z-10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-8 bg-gradient-to-b from-brand-500 to-amber-500 text-white text-xs font-black uppercase tracking-widest py-2 px-4 rounded-b-xl shadow-lg">Popular</div>
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-black text-white mb-2">Carriers</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <div className="text-5xl font-black text-white tracking-tight">$20</div>
                <div className="text-lg text-gray-400 font-medium">/driver/mo</div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold px-3 py-1.5 rounded-lg mb-4">
                <Zap className="w-3 h-3" /> 14-day free trial, no card required upfront
              </div>
              <p className="text-gray-400 font-medium">Access premium loads and manage your fleet efficiently.</p>
            </div>
            <ul className="space-y-5 mb-10 flex-1 relative z-10">
              <li className="flex items-center gap-4 font-bold text-gray-200"><CheckCircle2 className="w-6 h-6 text-brand-400" /> Full Loadboard Access</li>
              <li className="flex items-center gap-4 font-bold text-gray-200"><CheckCircle2 className="w-6 h-6 text-brand-400" /> Unlimited Dispatching</li>
              <li className="flex items-center gap-4 font-bold text-gray-200"><CheckCircle2 className="w-6 h-6 text-brand-400" /> Revenue Analytics</li>
              <li className="flex items-center gap-4 font-bold text-gray-200"><CheckCircle2 className="w-6 h-6 text-brand-400" /> Mobile Driver App Access</li>
            </ul>
            <Link href="/register" className="relative z-10 w-full text-center bg-brand-500 text-white font-black py-4 rounded-2xl hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-white/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0 text-gray-500 font-bold">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <span className="text-sm">© 2026 America Dispatch TMS. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm font-bold text-gray-500">
            <Link href="/privacy" className="hover:text-brand-600 transition-colors" target="_blank">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-600 transition-colors" target="_blank">Terms of Service</Link>
            <Link href="#" className="hover:text-brand-600 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, bg, border, glow }: { icon: React.ReactNode, title: string, description: string, bg: string, border: string, glow: string }) {
  return (
    <div className={`group glass-panel bg-white/80 border ${border} p-8 rounded-[2rem] hover:-translate-y-2 hover:shadow-2xl ${glow} transition-all duration-300`}>
      <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}
