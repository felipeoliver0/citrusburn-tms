'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { processRegistration, RegisterFormData } from './actions';
import { ArrowRight, ArrowLeft, Building2, UserCircle, CheckCircle2, Truck } from 'lucide-react';
import Link from 'next/link';

export default function MultiStepForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<RegisterFormData>>({
    role: 'CARRIER'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    setError('');
    
    // Basic validation per step
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.role) {
        return setError('Please fill in all required fields.');
      }
      if (formData.password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
    }
    
    if (step === 2) {
      if (!formData.companyName) {
        return setError('Company Name is required.');
      }
      if (!formData.usdotNumber) {
        return setError('USDOT # is required.');
      }
      if (!formData.mcNumber) {
        return setError('MC # is required.');
      }
    }

    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await processRegistration(formData as RegisterFormData);
      if (res.success) {
        router.push('/verify?email=' + encodeURIComponent(formData.email || ''));
      } else {
        setError(res.error || 'An unexpected error occurred.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Server action failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      
      {/* Progress Steps Header */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 -z-10 rounded-full transition-all duration-300`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
            step >= num 
              ? 'bg-brand-500 border-brand-500 text-white' 
              : 'bg-white border-gray-200 text-gray-300'
          }`}>
            {step > num ? <CheckCircle2 size={16} /> : num}
          </div>
        ))}
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          {step === 1 && 'Account Details'}
          {step === 2 && 'Company Information'}
          {step === 3 && 'Contact Information'}
          {step === 4 && 'Review & Submit'}
        </h2>
        <p className="text-gray-500 mt-2">
          {step === 1 && 'Set up your login credentials and choose your account type.'}
          {step === 2 && 'Tell us about your business operations and compliance.'}
          {step === 3 && 'Who should we contact regarding this account?'}
          {step === 4 && 'Verify your information before finalizing your registration.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center font-bold animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
        
        {/* STEP 1: Account */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Your Business</label>
              <div className="relative">
                <select 
                  name="role" 
                  value={formData.role || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 px-5 text-base text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold appearance-none cursor-pointer" 
                >
                  <option value="CARRIER">Carrier</option>
                  <option value="DEALER">Dealer</option>
                  <option value="BROKER">Broker</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Email Address *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email || ''}
                onChange={handleChange}
                required 
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 px-5 text-base text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold placeholder:text-gray-400" 
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Password *</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password || ''}
                onChange={handleChange}
                required 
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 px-5 text-base text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold placeholder:text-gray-400" 
                placeholder="Create a strong password (min. 6 chars)"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Company */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Company Name (DBA) *</label>
              <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="Acme Logistics LLC" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">USDOT # *</label>
                <input type="text" name="usdotNumber" value={formData.usdotNumber || ''} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="e.g. 1234567" />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">MC # *</label>
                <input type="text" name="mcNumber" value={formData.mcNumber || ''} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="e.g. MC-12345" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Country</label>
                <input type="text" name="companyCountry" value={formData.companyCountry || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="USA" />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Year Est.</label>
                <input type="text" name="yearEstablished" value={formData.yearEstablished || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="YYYY" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Company Address</label>
              <input type="text" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold mb-3" placeholder="Street Address" />
              <div className="grid grid-cols-3 gap-3">
                <input type="text" name="companyCity" value={formData.companyCity || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="City" />
                <input type="text" name="companyState" value={formData.companyState || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="State/Prov" />
                <input type="text" name="companyZip" value={formData.companyZip || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="Zip" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Hours of Operation</label>
                <input type="text" name="hoursOfOperation" value={formData.hoursOfOperation || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="e.g. 8AM - 5PM" />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Time Zone</label>
                <input type="text" name="timeZone" value={formData.timeZone || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="EST, PST, etc." />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Contact */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Owner First Name</label>
                <input type="text" name="ownerFirstName" value={formData.ownerFirstName || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="First Name" />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Owner Last Name</label>
                <input type="text" name="ownerLastName" value={formData.ownerLastName || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="Last Name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Business Phone</label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="(XXX) XXX-XXXX" />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Cell Phone</label>
                <input type="text" name="cellPhone" value={formData.cellPhone || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="(XXX) XXX-XXXX" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Website URL</label>
              <input type="text" name="websiteUrl" value={formData.websiteUrl || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">How did you hear about us?</label>
              <input type="text" name="howDidYouHear" value={formData.howDidYouHear || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded-xl py-4 px-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 font-bold" placeholder="Google, Referral, etc." />
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="font-black text-gray-800 text-lg border-b border-gray-200 pb-2 mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Email</span><span className="font-medium text-gray-900 break-all">{formData.email}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Role</span><span className="font-bold text-brand-500">{formData.role}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Company</span><span className="font-medium text-gray-900">{formData.companyName}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">USDOT</span><span className="font-medium text-gray-900">{formData.usdotNumber || '-'}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Owner</span><span className="font-medium text-gray-900">{formData.ownerFirstName || '-'} {formData.ownerLastName || ''}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Phone</span><span className="font-medium text-gray-900">{formData.phone || '-'}</span></div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 font-medium">
                By clicking "Complete Registration", you agree to our{' '}
                <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-8">
          {step > 1 && (
            <button 
              type="button" 
              onClick={prevStep}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Previous Step
            </button>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="flex-[2] py-4 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-2xl transition-all flex justify-center items-center gap-2 group shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (step === 4 ? 'Complete Registration' : 'Next Step')}
            {!loading && step < 4 && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            {!loading && step === 4 && <CheckCircle2 size={18} />}
          </button>
        </div>

      </form>
    </div>
  );
}
