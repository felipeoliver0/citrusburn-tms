import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Marketplace Booking Suite', () => {
  let brokerEmail = `broker_${Date.now()}@e2e.com`;
  let carrierEmail = `carrier_${Date.now()}@e2e.com`;
  let password = 'password123';

  test.beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: brokerEmail,
        passwordHash,
        role: 'BROKER',
        fullName: 'Booking Broker',
        emailVerified: true,
      }
    });
    await prisma.user.create({
      data: {
        email: carrierEmail,
        passwordHash,
        role: 'CARRIER',
        fullName: 'Booking Carrier',
        emailVerified: true,
      }
    });
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [brokerEmail, carrierEmail] } }
    });
    await prisma.$disconnect();
  });

  test('Carrier can request a load and Broker can approve', async ({ browser }) => {
    const brokerContext = await browser.newContext();
    const brokerPage = await brokerContext.newPage();
    const carrierContext = await browser.newContext();
    const carrierPage = await carrierContext.newPage();

    // Broker Login
    await brokerPage.goto('/login');
    await brokerPage.fill('input[name="email"]', brokerEmail);
    await brokerPage.fill('input[name="password"]', password);
    await brokerPage.click('button[type="submit"]');
    
    // Broker Posts Load
    await brokerPage.goto('/new-load');
    await brokerPage.fill('input[name="originCity"]', 'TestOrigin');
    await brokerPage.fill('input[name="originZip"]', '00000');
    await brokerPage.fill('input[name="destCity"]', 'TestDest');
    await brokerPage.fill('input[name="destZip"]', '11111');
    await brokerPage.fill('input[name="price"]', '1000');
    await brokerPage.fill('input[name="distance"]', '500');
    await brokerPage.click('button:has-text("Publish Load")');
    await expect(brokerPage).toHaveURL(/.*\/loadboard/);
    
    // Carrier Login
    await carrierPage.goto('/login');
    await carrierPage.fill('input[name="email"]', carrierEmail);
    await carrierPage.fill('input[name="password"]', password);
    await carrierPage.click('button[type="submit"]');

    // Carrier finds and requests load
    await carrierPage.goto('/loadboard');
    await carrierPage.fill('input[placeholder="City or Zip"]', 'TestOrigin');
    await carrierPage.keyboard.press('Enter');
    await carrierPage.waitForTimeout(1000);
    await carrierPage.click('text=TestOrigin');
    
    const requestBtn = carrierPage.locator('button:has-text("Request Load"), button:has-text("REQUEST LOAD")').first();
    await requestBtn.click();
    
    const submitBtn = carrierPage.locator('button:has-text("Submit Request")');
    if (await submitBtn.isVisible()) await submitBtn.click();

    // Broker Approves
    await brokerPage.goto('/broker-requests');
    const approveBtn = brokerPage.locator('button:has-text("Approve")').first();
    await approveBtn.click();
    
    await expect(brokerPage.locator('text=Approved').first()).toBeVisible({ timeout: 10000 });

    await brokerContext.close();
    await carrierContext.close();
  });
});
