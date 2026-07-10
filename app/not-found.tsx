import Link from 'next/link';
import { Truck, MapPin, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative selection:bg-brand-500 selection:text-white">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-200/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-200/30 rounded-full blur-[100px] pointer-events-none animate-float" />

      <div className="relative z-10 max-w-md w-full animate-fade-in-up">
        {/* Animated Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-brand-200/40 rounded-full animate-ping opacity-50" />
          <div className="relative bg-white rounded-full w-full h-full flex items-center justify-center shadow-xl border border-brand-100">
            <Truck className="w-12 h-12 text-brand-500 absolute left-8" />
            <MapPin className="w-8 h-8 text-gray-300 absolute right-8 top-8" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-black text-gray-900 mb-2 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Route Not Found</h2>
        
        <p className="text-gray-500 mb-8 font-medium">
          Looks like this route went off the map. We couldn&apos;t find the page you were looking for.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
