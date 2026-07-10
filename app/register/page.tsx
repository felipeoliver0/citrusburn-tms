import Link from 'next/link';
import { Truck } from 'lucide-react';
import MultiStepForm from './MultiStepForm';

export default async function Register({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error || '';

  return (
    <div className="min-h-screen w-full flex font-sans bg-gray-50 selection:bg-brand-500 selection:text-white">
      
      {/* Left Column: Image Background (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gray-900">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-brand-900/30" />
        
        <div className="absolute top-8 left-8 z-20">
          <Link href="/login" className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors font-bold uppercase tracking-wider bg-black/20 px-4 py-2 rounded-full backdrop-blur-xl border border-white/10">
            &larr; <span>Back to Login</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 p-12 w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white mb-8 border border-white/20 shadow-2xl shadow-brand-500/20">
            <Truck className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">The Modern Standard for Auto Transport</h2>
          <p className="text-lg xl:text-xl text-gray-300 font-medium max-w-lg leading-relaxed">Join thousands of shippers and carriers automating their logistics, tracking loads in real-time, and getting paid faster.</p>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-white p-8 sm:p-12 xl:p-24 relative overflow-y-auto shadow-2xl">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-200/30 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="lg:hidden absolute top-6 left-6 z-20">
          <Link href="/login" className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-2 transition-colors font-bold uppercase tracking-wider">
            &larr; <span>Back</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto animate-fade-in mt-12 lg:mt-0 relative z-10">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="font-black tracking-tight text-gray-900 text-2xl">America Dispatch</span>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center font-bold shadow-sm animate-fade-in">
              {error}
            </div>
          )}

          <MultiStepForm />

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 font-bold transition-colors">
                Log in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
