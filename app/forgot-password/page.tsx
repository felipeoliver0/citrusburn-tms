import Link from 'next/link';
import { Truck, Mail } from 'lucide-react';
import { handleForgotPassword } from './actions';

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, success?: string }>
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error || '';
  const success = resolvedParams?.success || '';

  return (
    <div className="min-h-screen w-full flex font-sans bg-gray-50 selection:bg-brand-500 selection:text-white">
      
      {/* Left Column */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gray-900">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000" 
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]" />
        
        <div className="absolute bottom-0 left-0 p-12 xl:p-20 w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center font-bold text-3xl text-white mb-8 border border-white/20 shadow-2xl shadow-brand-500/20">
            <Truck className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">Account Recovery</h2>
          <p className="text-lg xl:text-xl text-gray-300 font-medium max-w-lg leading-relaxed">Don't worry, we'll get you back on the road in no time. Enter your email to receive a secure reset link.</p>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-white p-8 sm:p-12 xl:p-24 relative overflow-y-auto shadow-2xl">

        <div className="w-full max-w-sm mx-auto animate-fade-in relative z-10">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-brand-500/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="font-black tracking-tight text-gray-900 text-2xl">AxleGrid</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">Forgot Password</h1>
          <p className="text-gray-500 font-medium mb-10 text-lg">Enter your email and we'll send you a recovery code.</p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center font-bold shadow-sm animate-fade-in">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center font-bold shadow-sm animate-fade-in">
              {success}
            </div>
          )}

          {!success && (
            <form action={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 pl-12 pr-5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold placeholder:text-gray-400 placeholder:font-medium" 
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-4 bg-brand-600 hover:bg-brand-500 text-white font-black py-4 text-lg rounded-2xl transition-all shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5"
              >
                Send Reset Code
              </button>
            </form>
          )}

          <div className="mt-12 text-center pt-8 border-t border-gray-100">
            <p className="text-gray-500 text-sm font-medium">
              Remembered your password?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-500 font-black transition-colors">
                Back to Login
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
