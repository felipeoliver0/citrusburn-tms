import prisma from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { signToken } from '@/lib/auth';
import { comparePassword } from '@/lib/hash';
import { ArrowRight, Truck } from 'lucide-react';
import { LoginSchema } from '@/lib/validations';
import { isRateLimited } from '@/lib/rateLimit';

export default async function Login({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error || '';

  async function handleLogin(formData: FormData) {
    'use server';

    const rawEmail = formData.get('email') as string;
    const rawPassword = formData.get('password') as string;

    // Validate input with Zod
    const parsed = LoginSchema.safeParse({ email: rawEmail, password: rawPassword });
    if (!parsed.success) {
      redirect('/login?error=Invalid+email+or+password');
    }

    const { email, password } = parsed.data;

    // Rate limit by IP to prevent general brute force
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown');
    if (await isRateLimited(`login-ip:${ip}`, 10)) {
      redirect('/login?error=Too+many+attempts.+Please+try+again+later.');
    }

    // Rate limit by email to prevent targeted brute force
    if (await isRateLimited(`login-email:${email}`, 5)) {
      redirect('/login?error=Account+temporarily+locked+due+to+many+attempts.');
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    const isPasswordValid = user ? await comparePassword(password, user.passwordHash) : false;

    if (!user || !isPasswordValid) {
      redirect('/login?error=Invalid+email+or+password');
    }

    // Block unverified accounts
    if (!user.emailVerified) {
      redirect(`/verify?email=${encodeURIComponent(user.email)}`);
    }

    const token = await signToken({ userId: user.id, role: user.role });
    const cookieStore = await cookies();
    
    cookieStore.delete('userId');
    
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7200, // 2 hours — matches JWT expiration
      path: '/'
    });

    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-gray-50 selection:bg-brand-500 selection:text-white">
      
      {/* Left Column: Image Background (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gray-900">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105" 
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]" />
        
        <div className="absolute bottom-0 left-0 p-12 xl:p-20 w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center font-bold text-3xl text-white mb-8 border border-white/20 shadow-2xl shadow-brand-500/20">
            <Truck className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">The Modern Standard for Auto Transport</h2>
          <p className="text-lg xl:text-xl text-gray-300 font-medium max-w-lg leading-relaxed">Join thousands of shippers and carriers automating their logistics, tracking loads in real-time, and getting paid faster.</p>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-white p-8 sm:p-12 xl:p-24 relative overflow-y-auto shadow-2xl">

        <div className="w-full max-w-sm mx-auto animate-fade-in relative z-10">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-brand-500/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="font-black tracking-tight text-gray-900 text-2xl">AxleGrid</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">Welcome Back</h1>
          <p className="text-gray-500 font-medium mb-10 text-lg">Enter your credentials to access your dashboard.</p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center font-bold shadow-sm animate-fade-in">
              {error}
            </div>
          )}
          
          <form action={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 px-5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold placeholder:text-gray-400 placeholder:font-medium" 
                placeholder="name@company.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest">Password</label>
              </div>
              <input 
                type="password" 
                name="password" 
                required 
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 px-5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold placeholder:text-gray-400 placeholder:font-medium" 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 bg-brand-600 hover:bg-brand-500 text-white font-black py-4 text-lg rounded-2xl transition-all flex justify-center items-center gap-2 group shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5"
            >
              Sign In
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-8 text-center flex justify-center gap-4 text-sm font-bold">
              <Link href="/terms" className="text-gray-400 hover:text-gray-600 transition-colors" target="_blank">Terms of Service</Link>
              <span className="text-gray-300">•</span>
              <Link href="/privacy" className="text-gray-400 hover:text-gray-600 transition-colors" target="_blank">Privacy Policy</Link>
            </div>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-gray-100">
            <p className="text-gray-500 text-sm font-medium">
              Don't have an account?{' '}
              <Link href="/register" className="text-brand-600 hover:text-brand-500 font-black transition-colors">
                Create one now
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
