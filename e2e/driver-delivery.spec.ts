import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Driver Delivery Suite', () => {
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
        fullName: 'Delivery Driver',
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
        driverId: driver.id,
        status: 'IN_TRANSIT',
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

  test('Driver can complete delivery and transition load to DELIVERED', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', driverEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.goto('/driver');
    
    await expect(page.locator('text=Drop City')).toBeVisible();

    const completeBtn = page.locator('button:has-text("Complete Delivery"), a:has-text("Complete Delivery")').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
    } else {
      await page.goto(`/driver/delivery/${loadId}`);
    }

    await expect(page.locator('text=Delivery')).toBeVisible();
    
    const confirmBtn = page.locator('button:has-text("Confirm Delivery")');
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
    }

    await expect(page.locator('text=Delivered').first()).toBeVisible({ timeout: 10000 });
  });
});
