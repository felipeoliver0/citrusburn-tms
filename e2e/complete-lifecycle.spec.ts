import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('E2E Marketplace Flow', () => {
  let brokerEmail = `broker_${Date.now()}@e2e.com`;
  let carrierEmail = `carrier_${Date.now()}@e2e.com`;
  let password = 'password123';

  test.beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    // Seed active broker
    await prisma.user.create({
      data: {
        email: brokerEmail,
        passwordHash,
        role: 'BROKER',
        fullName: 'E2E Broker',
        companyName: 'E2E Logistics',
        emailVerified: true,
        subscriptionStatus: 'ACTIVE',
      }
    });
    // Seed active carrier
    await prisma.user.create({
      data: {
        email: carrierEmail,
        passwordHash,
        role: 'CARRIER',
        fullName: 'E2E Carrier',
        companyName: 'E2E Transport',
        emailVerified: true,
        subscriptionStatus: 'ACTIVE',
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { in: [brokerEmail, carrierEmail] } }
    });
    await prisma.$disconnect();
  });

  test('Complete Flow: Broker posts load -> Carrier requests -> Broker approves -> Carrier delivers', async ({ browser }) => {
    // Context 1: Broker
    const brokerContext = await browser.newContext();
    const brokerPage = await brokerContext.newPage();
    
    // Context 2: Carrier
    const carrierContext = await browser.newContext();
    const carrierPage = await carrierContext.newPage();

    // 1. Broker logs in
    await brokerPage.goto('/login');
    await brokerPage.fill('input[name="email"]', brokerEmail);
    await brokerPage.fill('input[name="password"]', password);
    await brokerPage.click('button[type="submit"]');
    await expect(brokerPage).toHaveURL(/.*\/dashboard/);

    // 2. Carrier logs in
    await carrierPage.goto('/login');
    await carrierPage.fill('input[name="email"]', carrierEmail);
    await carrierPage.fill('input[name="password"]', password);
    await carrierPage.click('button[type="submit"]');
    await expect(carrierPage).toHaveURL(/.*\/dashboard/);

    // 3. Broker creates a load
    await brokerPage.goto('/new-load');
    await brokerPage.fill('input[name="originAddress"]', '123 E2E Origin St');
    await brokerPage.fill('input[name="originCity"]', 'Miami');
    await brokerPage.fill('input[name="originZip"]', '33101');
    await brokerPage.fill('input[name="destAddress"]', '456 E2E Dest Ave');
    await brokerPage.fill('input[name="destCity"]', 'Orlando');
    await brokerPage.fill('input[name="destZip"]', '32801');
    await brokerPage.fill('input[name="pickupDate"]', '2027-12-01');
    await brokerPage.fill('input[name="deliveryDate"]', '2027-12-05');
    await brokerPage.fill('input[name="price"]', '550');
    await brokerPage.fill('input[name="distance"]', '230');
    // Ensure vehicle input is filled
    await brokerPage.fill('input[placeholder*="Year, Make, Model"]', '2024 Tesla Model 3');
    await brokerPage.click('button:has-text("Publish Load")');
    await expect(brokerPage).toHaveURL(/.*\/loadboard/);
    await brokerPage.waitForSelector('text=Miami 33101');

    // 4. Carrier finds and requests load
    await carrierPage.goto('/loadboard');
    await carrierPage.locator('input[placeholder="City or Zip"]').first().fill('Miami');
    await carrierPage.keyboard.press('Enter');
    await carrierPage.waitForTimeout(2000);
    await carrierPage.click('text=Miami 33101');
    
    const requestBtn = carrierPage.locator('button:has-text("Request Load"), button:has-text("REQUEST LOAD")').first();
    await requestBtn.click();
    const submitRequestBtn = carrierPage.locator('button:has-text("Submit Request")');
    if (await submitRequestBtn.isVisible()) await submitRequestBtn.click();

    // 5. Broker approves the request
    await brokerPage.goto('/broker-requests');
    await brokerPage.click('button:has-text("Approve")'); 
    await expect(brokerPage.locator('text=Approved').first()).toBeVisible({ timeout: 10000 });

    // 6. Carrier assigns driver (self or fleet) - going to My Loads to assign
    await carrierPage.goto('/my-loads');
    // Assuming UI lets you assign from my-loads
    const assignBtn = carrierPage.locator('button:has-text("Assign Driver")').first();
    if (await assignBtn.isVisible()) {
        await assignBtn.click();
        // Select themselves if possible, or another driver
        await carrierPage.locator('select').first().selectOption({ index: 1 });
        await carrierPage.click('button:has-text("Confirm Assignment")');
    }

    // 7. Driver (Carrier acting as driver here) starts pickup
    await carrierPage.goto('/driver');
    await expect(carrierPage.locator('text=Miami 33101')).toBeVisible();
    
    const startPickupBtn = carrierPage.locator('button:has-text("Start Pickup Inspection"), a:has-text("Start Pickup Inspection")').first();
    if (await startPickupBtn.isVisible()) {
      await startPickupBtn.click();
      await carrierPage.click('button:has-text("Confirm Pickup")');
    }

    await expect(carrierPage.locator('text=In Transit').first()).toBeVisible({ timeout: 10000 });

    // 8. GPS / Transit is assumed running while status is IN_TRANSIT
    // We can simulate updating location via API if needed, or simply proceed to delivery

    // 9. Driver delivery & POD
    const completeDeliveryBtn = carrierPage.locator('button:has-text("Complete Delivery"), a:has-text("Complete Delivery")').first();
    if (await completeDeliveryBtn.isVisible()) {
      await completeDeliveryBtn.click();
      // Assume POD upload happens here if required
      await carrierPage.click('button:has-text("Confirm Delivery")');
    }

    await expect(carrierPage.locator('text=Delivered').first()).toBeVisible({ timeout: 10000 });

    // 10. Invoice (Broker marks as Invoiced)
    await brokerPage.goto('/board'); // Broker view of their loads
    await brokerPage.click('text=Miami 33101'); // open details
    const invoiceBtn = brokerPage.locator('button:has-text("Generate Invoice"), button:has-text("Mark as Invoiced")');
    if (await invoiceBtn.isVisible()) {
        await invoiceBtn.click();
        await expect(brokerPage.locator('text=Invoiced').first()).toBeVisible({ timeout: 10000 });
    }

    // 11. Review
    // Optionally leave a review
    const reviewBtn = carrierPage.locator('button:has-text("Leave Review")');
    if (await reviewBtn.isVisible()) {
        await reviewBtn.click();
        await carrierPage.locator('textarea').fill('Great broker!');
        await carrierPage.click('button:has-text("Submit Review")');
    }

    await brokerContext.close();
    await carrierContext.close();
  });
});
