import { verifySession } from '@/lib/dal';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { completeOnboardingAction } from './actions';
import { Truck } from 'lucide-react';

export default async function OnboardingPage() {
  const session = await verifySession();
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  if (!user || user.onboardingCompleted) {
    redirect('/dashboard');
  }

  const isBroker = user.role === 'BROKER';
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-200">
        
        {/* Left Side (Visuals) */}
        <div className="w-full md:w-5/12 bg-indigo-600 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <Truck size={24} className="text-white" />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight leading-tight">Welcome to America Dispatch!</h2>
            <p className="text-indigo-100 font-medium text-lg leading-relaxed">
              Let's get your profile set up so you can start {isBroker ? 'posting loads' : 'finding freight'} immediately.
            </p>
          </div>
          <div className="mt-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">1</div>
              <span className="font-semibold text-white">Company Profile</span>
            </div>
            <div className="w-0.5 h-6 bg-white/20 ml-4 my-1"></div>
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm border border-white/20">2</div>
              <span className="font-semibold text-white">Ready to Go!</span>
            </div>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-7/12 p-8 md:p-12">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Company Details</h1>
          <p className="text-gray-500 mb-8 font-medium">Please verify your business information to continue.</p>

          <form action={completeOnboardingAction} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Company Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="companyName" 
                defaultValue={user.companyName || ''}
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 text-gray-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
                placeholder="America Transport LLC"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Company Address</label>
              <input 
                type="text" 
                name="companyAddress" 
                defaultValue={user.companyAddress || ''}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 text-gray-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
                placeholder="123 Logistics Way, Miami, FL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">MC Number <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="mcNumber" 
                  defaultValue={user.mcNumber || ''}
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 text-gray-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="MC-123456"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">DOT Number <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="usdotNumber" 
                  defaultValue={user.usdotNumber || ''}
                  required
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 px-4 text-gray-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="US DOT 12345"
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl text-lg transition-all shadow-md shadow-indigo-500/20"
              >
                Complete Setup &rarr;
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
