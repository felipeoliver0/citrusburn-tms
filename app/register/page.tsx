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
      
      {/* Center Column: Form Area */}
      <div className="w-full flex flex-col items-center justify-center bg-white p-6 relative overflow-y-auto shadow-2xl">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-200/30 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="absolute top-6 left-6 z-20">
          <Link href="/login" className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-2 transition-colors font-bold uppercase tracking-wider">
            &larr; <span>Back to Login</span>
          </Link>
        </div>

        <div className="w-full max-w-xl mx-auto animate-fade-in relative z-10">
          
          <div className="flex items-center justify-center gap-3 mb-10">
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
