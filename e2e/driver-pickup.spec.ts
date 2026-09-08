import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Driver Pickup Suite', () => {
  let driverEmail = `driver_${Date.now()}@e2e.com`;
  let password = 'password123';
  let loadId = '';

  test.beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    const driver = await prisma.user.create({
      data: {
        email: driverEmail,
        passwordHash,
        role: 'DRIVER',
        fullName: 'Pickup Driver',
        emailVerified: true,
      }
    });

    const broker = await prisma.user.create({
      data: {
        email: `broker_${Date.now()}@e2e.com`,
        passwordHash,
        role: 'BROKER',
        fullName: 'Test Broker',
      }
    });

    const load = await prisma.load.create({
      data: {
        brokerId: broker.id,
        driverId: driver.id, // Pre-assign the driver
        status: 'BOOKED',
        originCity: 'Pickup City',
        originZip: '12345',
        destCity: 'Drop City',
        destZip: '54321',
        price: 500,
        distance: 100,
      }
    });
    loadId = load.id;
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@e2e.com' } }
    });
    await prisma.$disconnect();
  });

  test('Driver can start pickup inspection and transition load to IN_TRANSIT', async ({ page }) => {
    // Driver Login
    await page.goto('/login');
    await page.fill('input[name="email"]', driverEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Go to driver dashboard
    await page.goto('/driver');
    
    // Should see the assigned load
    await expect(page.locator('text=Pickup City')).toBeVisible();

    // Start Pickup Inspection
    const startBtn = page.locator('button:has-text("Start Pickup Inspection"), a:has-text("Start Pickup Inspection")').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
    } else {
      await page.goto(`/driver/pickup/${loadId}`);
    }

    // Complete Inspection (Mocking the UI actions)
    await expect(page.locator('text=Inspection')).toBeVisible();
    
    // Sign and Confirm
    const confirmBtn = page.locator('button:has-text("Confirm Pickup")');
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
    }

    // Load should now be IN_TRANSIT
    // We can verify via UI that it now shows "In Transit" or "Dropoff"
    await expect(page.locator('text=In Transit').first()).toBeVisible({ timeout: 10000 });
  });
});
