import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['CARRIER', 'BROKER'], { message: 'Role must be CARRIER or BROKER' }),
});

export const CreateDriverSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Invalid phone number').max(20).trim(),
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().max(100).trim().optional().or(z.literal('')),
  phone: z.string().max(20).trim().optional().or(z.literal('')),
  companyName: z.string().max(100).trim().optional().or(z.literal('')),
  companyAddress: z.string().max(200).trim().optional().or(z.literal('')),
  mcNumber: z.string().max(50).trim().optional().or(z.literal('')),
  usdotNumber: z.string().regex(/^\d{5,8}$/, 'USDOT must be between 5 and 8 digits').optional().or(z.literal('')),
  ein: z.string().max(20).trim().optional().or(z.literal('')),
  companyCity: z.string().max(100).trim().optional().or(z.literal('')),
  companyState: z.string().max(100).trim().optional().or(z.literal('')),
  companyZip: z.string().max(20).trim().optional().or(z.literal('')),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  yearEstablished: z.string().max(4).trim().optional().or(z.literal('')),
  timeZone: z.string().max(50).trim().optional().or(z.literal('')),
  hoursOfOperation: z.string().max(100).trim().optional().or(z.literal('')),
  cellPhone: z.string().max(20).trim().optional().or(z.literal('')),
  bondNumber: z.string().max(50).trim().optional().or(z.literal('')),
  insuranceCertUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// ─── Vehicle Schema ──────────────────────────────────────────────

export const VehicleSchema = z.object({
  make: z.string().max(50).optional().default(''),
  model: z.string().max(100).optional().default(''),
  year: z.union([z.number().int().min(1900).max(2035), z.string()]).optional(),
  type: z.string().max(50).optional().default(''),
  vin: z.string().max(17).optional().default(''),
  color: z.string().max(30).optional().default(''),
  lot: z.string().max(50).optional().default(''),
});

// ─── Load Schemas ────────────────────────────────────────────────

export const CreateLoadSchema = z.object({
  originAddress: z.string().min(1, 'Origin address is required').max(200).trim(),
  originCity: z.string().min(1, 'Origin city is required').max(100).trim(),
  originZip: z.string().min(3, 'Origin ZIP is required').max(20).trim(),
  destAddress: z.string().min(1, 'Destination address is required').max(200).trim(),
  destCity: z.string().min(1, 'Destination city is required').max(100).trim(),
  destZip: z.string().min(3, 'Destination ZIP is required').max(20).trim(),
  price: z.number().positive('Price must be positive').max(1_000_000),
  distance: z.number().positive('Distance must be positive').max(100_000),
  trailerType: z.string().min(1).max(50).default('OPEN'),
  paymentType: z.string().min(1).max(50).default('COD'),
  vehiclesList: z.array(VehicleSchema).max(20).default([]),
  pickupDate: z.string().min(1, 'Pickup date is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
});

export const UpdateLoadSchema = z.object({
  loadId: z.string().uuid('Invalid load ID'),
  originAddress: z.string().max(200).trim().optional(),
  originCity: z.string().min(1).max(100).trim(),
  originZip: z.string().min(3).max(20).trim(),
  destAddress: z.string().max(200).trim().optional(),
  destCity: z.string().min(1).max(100).trim(),
  destZip: z.string().min(3).max(20).trim(),
  price: z.number().positive().max(1_000_000),
  distance: z.number().positive().max(100_000),
  trailerType: z.string().min(1).max(50),
  paymentType: z.string().min(1).max(50),
  vehiclesList: z.array(VehicleSchema).max(20).default([]),
});

export const SubmitInspectionSchema = z.object({
  loadId: z.string().uuid('Invalid load ID'),
  type: z.enum(['pickup', 'delivery']),
  vin: z.string().max(17).optional().default(''),
  vinPhoto: z.string().max(5_000_000, 'Photo too large (max ~3.7MB)').optional().default(''),
  damagesRaw: z.string().max(10_000_000, 'Damages data too large').optional().default('[]'),
  vehiclePhotosRaw: z.string().max(10_000_000, 'Photos data too large').optional().default('[]'),
  signature: z.string().min(1, 'Signature is required').max(2_000_000, 'Signature data too large'),
});

// ─── GPS / Tracking Schemas ──────────────────────────────────────

export const TrackingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const LocationUpdateSchema = z.object({
  loadId: z.string().uuid('Invalid load ID'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ─── Review Schema ───────────────────────────────────────────────

export const ReviewSchema = z.object({
  loadId: z.string().uuid('Invalid load ID'),
  targetId: z.string().uuid('Invalid target user ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});
