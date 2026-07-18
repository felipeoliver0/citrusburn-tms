'use server';

import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/hash';
import { z } from 'zod';
import { getTrialEndDate } from '@/lib/subscription';
import { headers } from 'next/headers';
import { isRateLimited } from '@/lib/rateLimit';
import { randomInt } from 'crypto';
import { Resend } from 'resend';

// Relaxed validation schema to allow optional fields
const AdvancedRegisterSchema = z.object({
  email: z.string().email('Invalid email format').transform((val) => val.trim().toLowerCase()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['BROKER', 'CARRIER', 'DEALER']),
  
  // Company Info (Step 2)
  companyName: z.string().min(1, 'Company Name is required'),
  yearEstablished: z.string().optional(),
  usdotNumber: z.string().regex(/^\d{5,8}$/, 'USDOT must be between 5 and 8 digits').optional().or(z.literal('')),
  mcNumber: z.string().regex(/^\d{6,7}$/, 'MC Number must be between 6 and 7 digits').optional().or(z.literal('')),
  companyCountry: z.string().optional(),
  companyAddress: z.string().optional(),
  companyCity: z.string().optional(),
  companyState: z.string().optional(),
  companyZip: z.string().optional(),
  hoursOfOperation: z.string().optional(),
  timeZone: z.string().optional(),
  websiteUrl: z.string().optional(),

  // Contact Info (Step 3)
  ownerFirstName: z.string().optional(),
  ownerLastName: z.string().optional(),
  phone: z.string().optional(),
  cellPhone: z.string().optional(),
  howDidYouHear: z.string().optional(),
}).refine((data) => {
  if (data.role === 'CARRIER') {
    return !!data.mcNumber && !!data.usdotNumber;
  }
  return true;
}, {
  message: "MC and USDOT numbers are required for Carriers",
  path: ["mcNumber"],
});

export type RegisterFormData = z.infer<typeof AdvancedRegisterSchema>;

export async function processRegistration(data: RegisterFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = AdvancedRegisterSchema.safeParse(data);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || 'Invalid input';
      return { success: false, error: firstError };
    }

    const validData = parsed.data;

    // Rate limit by IP to prevent mass registration
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown');
    if (await isRateLimited(`register-ip:${ip}`, 5)) {
      return { success: false, error: 'Too many attempts. Please try again later.' };
    }

    const userExists = await prisma.user.findUnique({ where: { email: validData.email } });

    if (userExists) {
      return { success: false, error: 'Email already in use. Log in instead.' };
    }

    const hashedPassword = await hashPassword(validData.password);
    
    // Combine First and Last name for fullName if provided, else fallback to companyName
    let fullName = validData.companyName;
    if (validData.ownerFirstName || validData.ownerLastName) {
      fullName = `${validData.ownerFirstName || ''} ${validData.ownerLastName || ''}`.trim();
    }
    
    const code = randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.user.create({
      data: {
        email: validData.email,
        passwordHash: hashedPassword,
        role: validData.role,
        fullName: fullName,
        companyName: validData.companyName,
        emailVerified: false,
        verificationCode: code,
        verificationCodeExpiry: codeExpiry,
        
        // Advanced Fields
        companyAddress: validData.companyAddress,
        phone: validData.phone,
        mcNumber: validData.mcNumber,
        usdotNumber: validData.usdotNumber,
        websiteUrl: validData.websiteUrl,
        yearEstablished: validData.yearEstablished,
        companyCountry: validData.companyCountry,
        companyCity: validData.companyCity,
        companyState: validData.companyState,
        companyZip: validData.companyZip,
        timeZone: validData.timeZone,
        hoursOfOperation: validData.hoursOfOperation,
        cellPhone: validData.cellPhone,
        howDidYouHear: validData.howDidYouHear,

        ...(validData.role === 'CARRIER'
          ? { subscriptionStatus: 'TRIAL' as const, trialEndsAt: getTrialEndDate() }
          : {}),
      },
    });

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'AxleGrid TMS <onboarding@resend.dev>',
        to: validData.email,
        subject: 'Verify your email - AxleGrid TMS',
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              <div style="background-color: #09090b; padding: 30px; text-align: center;">
                <div style="display: inline-block; width: 48px; height: 48px; background-color: #2563eb; color: #ffffff; border-radius: 12px; font-size: 24px; font-weight: bold; line-height: 48px; margin-bottom: 12px;">H</div>
                <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">AxleGrid TMS</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #0f172a; font-size: 20px; margin-top: 0; margin-bottom: 16px; font-weight: 700;">Welcome, ${fullName}!</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">Thanks for registering. Please use the code below to verify your email address:</p>
                <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                  <span style="font-family: monospace; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${code}</span>
                </div>
              </div>
            </div>
          </div>
        `
      });
    }

    return { success: true };
    
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { success: false, error: 'Email associated with a disabled account. Please contact support.' };
    }
    console.error('Error creating user:', error);
    return { success: false, error: 'An unexpected error occurred during registration. Please try again later.' };
  }
}
