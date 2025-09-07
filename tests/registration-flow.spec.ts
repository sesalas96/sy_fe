import { test, expect } from '@playwright/test';
import { AuthHelpers } from './helpers/auth-helpers';

test.describe('Registration Flow Tests', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
  });

  test('should display mock data on initial load', async ({ page }) => {
    await page.goto('/register');
    
    // Verify mock data is pre-filled
    await authHelpers.verifyMockDataPreFilled();
    
    // Verify step 1 is displayed
    await authHelpers.verifyRegistrationStep(1);
  });

  test('should complete registration and redirect to login with pre-filled email', async ({ page }) => {
    const registrationData = await authHelpers.completeRegistration({
      email: `playwright-${Date.now()}@test.com`
    });

    // Should be on success page
    await expect(page.getByText('¡Registro Exitoso!')).toBeVisible();
    
    // Click go to login
    await page.getByText('Ir a Inicio de Sesión').click();
    
    // Should be on login with success message and pre-filled email
    await expect(page.getByText('Registro completado exitosamente')).toBeVisible();
    await expect(page.locator(`input[value="${registrationData.email}"]`)).toBeVisible();
  });

  test('should navigate between all registration steps', async ({ page }) => {
    await page.goto('/register');
    
    // Verify step 1
    await authHelpers.verifyRegistrationStep(1);
    
    // Go to step 2
    await page.getByText('Siguiente').click();
    await authHelpers.verifyRegistrationStep(2);
    
    // Go to step 3
    await page.getByText('Siguiente').click();
    await authHelpers.verifyRegistrationStep(3);
    
    // Go to step 4
    await page.getByText('Siguiente').click();
    await authHelpers.verifyRegistrationStep(4);
    
    // Go back to step 3
    await page.getByText('Anterior').click();
    await authHelpers.verifyRegistrationStep(3);
    
    // Go back to step 2
    await page.getByText('Anterior').click();
    await authHelpers.verifyRegistrationStep(2);
    
    // Go back to step 1
    await page.getByText('Anterior').click();
    await authHelpers.verifyRegistrationStep(1);
  });

  test('should validate invitation code length', async ({ page }) => {
    await authHelpers.goToRegistrationStep(2);
    
    // Test invalid code (too short)
    await page.getByLabel('Código Temporal').fill('ABC');
    await page.getByText('Siguiente').click();
    
    // Should show error
    await expect(page.getByText('El código debe tener exactamente 6 caracteres')).toBeVisible();
    
    // Test valid code
    await page.getByLabel('Código Temporal').fill('ABC123');
    await page.getByText('Siguiente').click();
    
    // Should proceed to step 3
    await authHelpers.verifyRegistrationStep(3);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register');
    
    // Clear all fields
    await page.getByLabel('Nombre').fill('');
    await page.getByLabel('Apellidos').fill('');
    await page.getByLabel('Correo Electrónico').fill('');
    
    // Try to proceed
    await page.getByText('Siguiente').click();
    
    // Should show validation errors
    await expect(page.getByText('Nombre es requerido')).toBeVisible();
    await expect(page.getByText('Apellidos es requerido')).toBeVisible();
    await expect(page.getByText('Correo Electrónico es requerido')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    // Enter invalid email
    await page.getByLabel('Correo Electrónico').fill('invalid-email');
    await page.getByText('Siguiente').click();
    
    // Should show email format error
    await expect(page.getByText('Email inválido')).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await authHelpers.goToRegistrationStep(4);
    
    // Test weak password
    await page.getByLabel('Contraseña', { exact: true }).fill('123');
    await page.getByLabel('Confirmar Contraseña').fill('123');
    
    // Try to complete
    await page.getByText('Completar Registro').click();
    
    // Should show password validation errors
    await expect(page.getByText('Debe tener al menos 8 caracteres')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await authHelpers.goToRegistrationStep(4);
    
    // Enter mismatched passwords
    await page.getByLabel('Contraseña', { exact: true }).fill('StrongPass123!');
    await page.getByLabel('Confirmar Contraseña').fill('DifferentPass123!');
    
    // Try to complete
    await page.getByText('Completar Registro').click();
    
    // Should show password mismatch error
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
  });

  test('should require terms and conditions acceptance', async ({ page }) => {
    await authHelpers.goToRegistrationStep(4);
    
    // Don't check terms and conditions
    await page.getByLabel('Acepto los términos y condiciones').uncheck();
    await page.getByLabel('Acepto la política de privacidad').uncheck();
    
    // Try to complete
    await page.getByText('Completar Registro').click();
    
    // Should show validation errors
    await expect(page.getByText('Debes aceptar para continuar')).toBeVisible();
  });

  test('should format cedula correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Enter unformatted cedula
    await page.getByLabel('Cédula').fill('112345678');
    
    // Should format to 1-1234-5678
    await expect(page.locator('input[value="1-1234-5678"]')).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/register');
    
    // Should display mobile layout
    // Complete registration on mobile
    const testEmail = `mobile-test-${Date.now()}@playwright.com`;
    await authHelpers.completeRegistration({ email: testEmail });
    
    // Should complete successfully
    await expect(page.getByText('¡Registro Exitoso!')).toBeVisible();
  });

  test('should display watermark logo correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Should have logo watermark (check for logo image)
    const logoImages = page.locator('img[src="/safety-logo.png"]');
    await expect(logoImages.first()).toBeVisible();
  });

  test('should show correct progress percentages', async ({ page }) => {
    await page.goto('/register');
    
    // Step 1 - 25%
    await expect(page.getByText('25%')).toBeVisible();
    
    await page.getByText('Siguiente').click();
    // Step 2 - 50%
    await expect(page.getByText('50%')).toBeVisible();
    
    await page.getByText('Siguiente').click();
    // Step 3 - 75%
    await expect(page.getByText('75%')).toBeVisible();
    
    await page.getByText('Siguiente').click();
    // Step 4 - 100%
    await expect(page.getByText('100%')).toBeVisible();
  });
});