import prisma from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ShieldCheck, RefreshCw, Truck } from 'lucide-react';
import { isRateLimited } from '@/lib/rateLimit';
import { Resend } from 'resend';
import { randomInt } from 'crypto';

export default async function Verify({ 
  searchParams 
}: { 
  searchParams: Promise<{ email?: string; error?: string }> 
}) {
  const resolvedParams = await searchParams;
  const email = resolvedParams.email || '';
  const error = resolvedParams.error || '';
  const success = (resolvedParams as any).success || '';

  async function handleVerifyCode(formData: FormData) {
    'use server';

    const userEmail = formData.get('email') as string;
    const code = formData.get('code') as string;

    // Rate limit check: 5 attempts per email to prevent brute-forcing the 6-digit code
    if (await isRateLimited(`verify-email:${userEmail}`, 5)) {
      redirect(`/verify?email=${userEmail}&error=Too+many+attempts.+Please+try+again+later.`);
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user || user.verificationCode !== code) {
      redirect(`/verify?email=${userEmail}&error=Invalid+verification+code`);
    }

    // Check if code has expired
    if (user.verificationCodeExpiry && new Date() > new Date(user.verificationCodeExpiry)) {
      redirect(`/verify?email=${userEmail}&error=Code+expired.+Please+request+a+new+one.`);
    }

    await prisma.user.update({
      where: { email: userEmail },
      data: {
        emailVerified: true,
        verificationCode: null
      }
    });

    redirect('/login?verified=true');
  }

  async function handleResendCode(formData: FormData) {
    'use server';

    const userEmail = formData.get('email') as string;

    if (await isRateLimited(`resend-email:${userEmail}`, 3)) {
      redirect(`/verify?email=${userEmail}&error=Too+many+resend+attempts.+Please+wait+a+while.`);
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user || user.emailVerified) {
      redirect(`/login`);
    }

    const code = randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { email: userEmail },
      data: { verificationCode: code, verificationCodeExpiry: codeExpiry }
    });

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'CitrusBurn TMS <onboarding@resend.dev>',
        to: userEmail,
        subject: 'Your new verification code - AxleGrid TMS',
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              <div style="background-color: #09090b; padding: 30px; text-align: center;">
                <div style="display: inline-block; width: 48px; height: 48px; background-color: #2563eb; color: #ffffff; border-radius: 12px; font-size: 24px; font-weight: bold; line-height: 48px; margin-bottom: 12px;">H</div>
                <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">AxleGrid TMS</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #0f172a; font-size: 20px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">Hello!</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">You requested a new verification code. Please use the code below:</p>
                <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                  <span style="font-family: monospace; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${code}</span>
                </div>
              </div>
            </div>
          </div>
        `
      });
    }

    redirect(`/verify?email=${userEmail}&success=A+new+code+has+been+sent+to+your+email`);
  }

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
          <Link href="/login" className="text-white/60 hover:text-white text-sm flex items-center gap-2 transition-colors font-bold uppercase tracking-wider bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            &larr; <span>Back to Login</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 p-12 w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white mb-8 border border-white/20 shadow-2xl shadow-brand-500/20">
            <ShieldCheck size={32} className="text-brand-400" />
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">Enterprise-Grade Security</h2>
          <p className="text-lg xl:text-xl text-gray-300 font-medium max-w-lg leading-relaxed">We take the security of your freight business seriously. Please verify your identity to access the platform.</p>
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
            <span className="font-black tracking-tight text-gray-900 text-2xl">AxleGrid</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">Verify Email</h1>
          <p className="text-gray-500 font-medium mb-10 text-lg">
            We sent a verification code to <span className="text-brand-600 font-bold">{email}</span>
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center font-bold">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center font-bold">
              {success}
            </div>
          )}
          
          <form action={handleVerifyCode} className="space-y-6">
            <input type="hidden" name="email" value={email} />

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit Code
              </label>
              <input 
                type="text" 
                name="code" 
                maxLength={6}
                required 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-mono text-3xl tracking-[0.5em] text-center" 
                placeholder="000000"
              />
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 bg-brand-500 hover:bg-brand-400 text-white font-black py-4 rounded-2xl transition-all flex justify-center items-center gap-2 group shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5"
            >
              Verify Account
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-6 text-center flex justify-center gap-4 text-xs font-medium border-b border-gray-100 pb-6">
              <Link href="/terms" className="text-gray-400 hover:text-gray-600 transition-colors" target="_blank">Terms of Service</Link>
              <span className="text-gray-300">•</span>
              <Link href="/privacy" className="text-gray-400 hover:text-gray-600 transition-colors" target="_blank">Privacy Policy</Link>
            </div>
          </form>

          <form action={handleResendCode} className="mt-6 text-center">
            <input type="hidden" name="email" value={email} />
            <p className="text-gray-500 text-sm font-medium mb-2">Didn&apos;t receive the code?</p>
            <button 
              type="submit" 
              className="text-brand-600 hover:text-brand-700 font-bold transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={14} /> Resend Code
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
