import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/AxleGrid|Login/);
});

test('enforces rate limit after 5 failed login attempts', async ({ page }) => {
  // Teste focado em validar se o sistema de rate limit por email bloqueia tentativas excessivas
  await page.goto('/login');

  const emailInput = page.getByPlaceholder(/email/i);
  const passwordInput = page.getByPlaceholder(/password/i);
  const submitButton = page.getByRole('button', { name: /login|sign in/i });

  // Tenta logar com a mesma conta e senha errada 6 vezes
  for (let i = 0; i < 6; i++) {
    await emailInput.fill('brute.force@example.com');
    await passwordInput.fill('wrongpassword123');
    await submitButton.click();
    
    // Aguarda a resposta (navegação ou erro)
    await page.waitForLoadState('networkidle');
  }

  // Na 6ª tentativa, deve aparecer a mensagem de erro de rate limit definida na action
  await expect(page.getByText(/Account temporarily locked due to many attempts/i)).toBeVisible({ timeout: 10000 });
});
