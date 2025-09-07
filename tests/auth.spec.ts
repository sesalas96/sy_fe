import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should navigate from login to registration', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Verify login page loaded
    await expect(page.getByText('Inicio de Sesión')).toBeVisible();
    await expect(page.getByText('Sistema de Gestión de Seguridad')).toBeVisible();
    
    // Click register link
    await page.getByText('Regístrate aquí').click();
    
    // Verify registration page loaded
    await expect(page.getByText('Registro de Usuario')).toBeVisible();
    await expect(page.getByText('Información Personal Básica')).toBeVisible();
  });

  test('should display registration form and navigate through steps', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');
    
    // Verify registration page loaded
    await expect(page.getByText('Registro de Usuario')).toBeVisible();
    await expect(page.getByText('Información Personal Básica')).toBeVisible();
    
    // Step 1: Verify form fields are present
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await expect(page.getByLabel('Apellidos')).toBeVisible();
    await expect(page.getByLabel('Correo Electrónico')).toBeVisible();
    await expect(page.getByLabel('Teléfono')).toBeVisible();
    await expect(page.getByLabel('Cédula')).toBeVisible();
    
    // Verify mock data is pre-filled
    await expect(page.locator('input[value="Juan Carlos"]')).toBeVisible();
    await expect(page.locator('input[value="juan.perez@test.com"]')).toBeVisible();
    
    // Verify progress bar shows 25%
    await expect(page.getByText('25%')).toBeVisible();
    
    // Verify buttons are present
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible();
  });

  test('should validate email uniqueness in step 1', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');
    
    // Fill form with existing email (if email verification API works)
    await page.getByLabel('Correo Electrónico').fill('admin@safety.com');
    
    // Try to proceed to next step
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    
    // Should show error if email exists (when backend is available)
    // This test will depend on backend implementation
  });

  test('should validate invitation code format', async ({ page }) => {
    // Navigate to registration and go to step 2
    await page.goto('/register');
    await page.getByRole('button', { name: 'Siguiente' }).first().click(); // Skip step 1
    
    // Try invalid invitation code
    await page.getByLabel('Código Temporal').fill('ABC'); // Less than 6 chars
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    
    // Should show validation error
    await expect(page.getByText('El código debe tener exactamente 6 caracteres')).toBeVisible();
    
    // Try valid invitation code
    await page.getByLabel('Código Temporal').fill('ABC123'); // Exactly 6 chars
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    
    // Should proceed to next step
    await expect(page.getByText('Información Específica del Contratista')).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    // Navigate to registration and go to step 4
    await page.goto('/register');
    
    // Skip to step 4
    await page.getByRole('button', { name: 'Siguiente' }).first().click(); // Step 1
    await page.getByRole('button', { name: 'Siguiente' }).first().click(); // Step 2
    await page.getByRole('button', { name: 'Siguiente' }).first().click(); // Step 3
    
    // Test weak password
    await page.getByLabel('Contraseña', { exact: true }).fill('123');
    await page.getByLabel('Confirmar Contraseña').fill('123');
    
    // Try to complete registration
    await page.getByText('Completar Registro').click();
    
    // Should show password validation errors
    await expect(page.getByText('Debe tener al menos 8 caracteres')).toBeVisible();
  });


  test('should handle login errors', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Enter invalid credentials
    await page.getByLabel('Correo Electrónico').fill('invalid@email.com');
    await page.getByLabel('Contraseña').fill('wrongpassword');
    
    // Submit form
    await page.getByText('Iniciar Sesión').click();
    
    // Should show error message
    await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible();
  });

  test('should navigate between registration steps', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');
    
    // Go to step 2
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    await expect(page.getByText('Código de Invitación')).toBeVisible();
    
    // Go back to step 1
    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect(page.getByText('Información Personal Básica')).toBeVisible();
    
    // Go forward again
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    await expect(page.getByText('Código de Invitación')).toBeVisible();
    
    // Continue to step 3
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    await expect(page.getByText('Información Específica del Contratista')).toBeVisible();
    
    // Go back to step 2
    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect(page.getByText('Código de Invitación')).toBeVisible();
  });

  test('should show progress bar correctly', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');
    
    // Should show 25% progress (step 1 of 4)
    await expect(page.getByText('25%')).toBeVisible();
    
    // Go to step 2
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    await expect(page.getByText('50%')).toBeVisible();
    
    // Go to step 3
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    await expect(page.getByText('75%')).toBeVisible();
    
    // Go to step 4
    await page.getByRole('button', { name: 'Siguiente' }).first().click();
    await expect(page.getByText('100%')).toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to registration
    await page.goto('/register');
    
    // Should see mobile-specific elements
    // Watermark should be with bottom buttons on mobile
    // Buttons should have proper mobile sizing
    
    // Complete registration flow on mobile
    await page.getByRole('button', { name: 'Siguiente' }).first().click(); // Step 1
    await page.getByRole('button', { name: 'Siguiente' }).first().click(); // Step 2  
    await page.getByRole('button', { name: 'Siguiente' }).first().click(); // Step 3
    await page.getByRole('button', { name: 'Completar Registro' }).click(); // Step 4
    
    // Should complete successfully on mobile
    await expect(page.getByText('¡Registro Exitoso!')).toBeVisible();
  });
});