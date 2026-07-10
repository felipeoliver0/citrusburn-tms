'use client';

import { useState, useEffect } from 'react';
import { Plus, CreditCard, UserPlus } from 'lucide-react';
import { createDriverAction } from './actions';
import { z } from 'zod';
import toast from 'react-hot-toast';

const driverSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number is too short").optional().or(z.literal('')),
});

export default function DriverForm() {
  const [price, setPrice] = useState(20.00);
  const [isProrated, setIsProrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Calculate if we are in the last 10 days of the month
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    
    // Get total days in the current month
    // Date(year, month + 1, 0) gives the last day of the current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getDate();

    // If we are in the last 10 days of the month
    if (currentDay > totalDays - 10) {
      setPrice(12.50);
      setIsProrated(true);
    } else {
      setPrice(20.00);
      setIsProrated(false);
    }
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      password: formData.get('password'),
      phone: formData.get('phone'),
    };

    const result = driverSchema.safeParse(data);

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setIsSubmitting(false);
      return;
    }

    try {
      const loadingToast = toast.loading('Processing payment & creating driver...');
      await createDriverAction(formData);
      toast.success(`Driver created successfully! Billed $${price.toFixed(2)}`, { id: loadingToast });
      // Form resets automatically due to server action revalidation
    } catch (error: any) {
      toast.error(error.message || 'Error creating driver. Email may be in use.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <UserPlus size={100} />
      </div>
      
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <Plus size={20} className="text-brand-500" /> Register Driver
      </h2>
      
      <form action={handleSubmit} className="space-y-4 relative z-10">
        <div>
          <label className="block text-sm uppercase text-gray-500 font-bold mb-1 tracking-wider">Full Name</label>
          <input 
            type="text" 
            name="fullName" 
            required 
            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" 
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm uppercase text-gray-500 font-bold mb-1 tracking-wider">Email (Login ID)</label>
          <input 
            type="email" 
            name="email" 
            required 
            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" 
            placeholder="driver@company.com"
          />
        </div>

        <div>
          <label className="block text-sm uppercase text-gray-500 font-bold mb-1 tracking-wider">Password</label>
          <input 
            type="password" 
            name="password" 
            required 
            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" 
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm uppercase text-gray-500 font-bold mb-1 tracking-wider">Phone</label>
          <input 
            type="tel" 
            name="phone" 
            className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-base text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" 
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">Monthly Seat License</span>
            <span className="text-lg font-black text-gray-900">${price.toFixed(2)}<span className="text-xs font-normal text-gray-500">/mo</span></span>
          </div>
          {isProrated ? (
            <p className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded inline-block">
              Prorated for the last 10 days of the month!
            </p>
          ) : (
            <p className="text-[10px] text-gray-500">Standard monthly rate applies.</p>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <CreditCard size={14} className="text-brand-500" />
            <span>Card ending in <strong>4242</strong> will be charged</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full mt-4 bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 text-lg rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : `Pay $${price.toFixed(2)} & Add Driver`}
        </button>
      </form>
    </div>
  );
}
