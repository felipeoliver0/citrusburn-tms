import { describe, it, expect } from 'vitest';
import { RegisterSchema, CreateLoadSchema, TrackingSchema } from '@/lib/validations';

describe('RegisterSchema', () => {
  it('accepts valid carrier registration', () => {
    const result = RegisterSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password1',
      role: 'CARRIER',
    });
    expect(result.success).toBe(true);
  });

  it('rejects weak passwords', () => {
    const result = RegisterSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: '12345678',
      role: 'CARRIER',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid roles', () => {
    const result = RegisterSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password1',
      role: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateLoadSchema', () => {
  it('accepts valid load data', () => {
    const result = CreateLoadSchema.safeParse({
      originAddress: '123 Main St',
      originCity: 'Miami, FL',
      originZip: '33101',
      destAddress: '456 Oak Ave',
      destCity: 'Atlanta, GA',
      destZip: '30301',
      price: 850,
      distance: 660,
      trailerType: 'OPEN',
      paymentType: 'COD',
      vehiclesList: [],
      pickupDate: '2026-07-01',
      deliveryDate: '2026-07-03',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative price', () => {
    const result = CreateLoadSchema.safeParse({
      originAddress: '123 Main St',
      originCity: 'Miami, FL',
      originZip: '33101',
      destAddress: '456 Oak Ave',
      destCity: 'Atlanta, GA',
      destZip: '30301',
      price: -100,
      distance: 660,
      pickupDate: '2026-07-01',
      deliveryDate: '2026-07-03',
    });
    expect(result.success).toBe(false);
  });
});

describe('TrackingSchema', () => {
  it('accepts valid coordinates', () => {
    const result = TrackingSchema.safeParse({ lat: 25.7617, lng: -80.1918 });
    expect(result.success).toBe(true);
  });

  it('rejects out-of-range latitude', () => {
    const result = TrackingSchema.safeParse({ lat: 91, lng: 0 });
    expect(result.success).toBe(false);
  });
});
