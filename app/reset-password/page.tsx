import Link from 'next/link';
import { Truck, ShieldCheck, Lock } from 'lucide-react';
import { handleResetPassword } from './actions';

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; success?: string }>
}) {
  const resolvedParams = await searchParams;
  const email = resolvedParams?.email || '';
  const error = resolvedParams?.error || '';
  const success = resolvedParams?.success || '';

  return (
    <div className="min-h-screen w-full flex font-sans bg-gray-50 selection:bg-brand-500 selection:text-white">
      
      {/* Left Column */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gray-900">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]" />
        
        <div className="absolute bottom-0 left-0 p-12 xl:p-20 w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center font-bold text-3xl text-white mb-8 border border-white/20 shadow-2xl shadow-brand-500/20">
            <ShieldCheck className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">Secure Reset</h2>
          <p className="text-lg xl:text-xl text-gray-300 font-medium max-w-lg leading-relaxed">Create a strong new password to keep your account and your fleet's data secure.</p>
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

          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">New Password</h1>
          <p className="text-gray-500 font-medium mb-10 text-lg">Enter the 6-digit code sent to your email and your new password.</p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center font-bold shadow-sm animate-fade-in">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center font-bold shadow-sm">
                {success}
              </div>
              <Link href="/login" className="inline-block bg-brand-600 hover:bg-brand-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5">
                Go to Login
              </Link>
            </div>
          ) : (
            <form action={handleResetPassword} className="space-y-6">
              <input type="hidden" name="email" value={email} />
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
                  6-Digit Recovery Code
                </label>
                <input 
                  type="text" 
                  name="code" 
                  maxLength={6}
                  required 
                  className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 px-5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-mono text-3xl tracking-[0.5em] text-center mb-6" 
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="password" 
                    name="password" 
                    required 
                    minLength={8}
                    className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 pl-12 pr-5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold placeholder:text-gray-400" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    required 
                    minLength={8}
                    className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 pl-12 pr-5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold placeholder:text-gray-400" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full mt-4 bg-brand-600 hover:bg-brand-500 text-white font-black py-4 text-lg rounded-2xl transition-all shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5"
              >
                Reset Password
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-12 text-center pt-8 border-t border-gray-100">
              <Link href="/login" className="text-gray-500 hover:text-gray-900 font-bold transition-colors">
                Cancel
              </Link>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
