import { test, expect } from '@playwright/test';
import { AuthHelpers } from './helpers/auth-helpers';

test.describe('Login Flow Tests', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page elements
    await expect(page.getByText('Inicio de Sesión')).toBeVisible();
    await expect(page.getByText('Sistema de Gestión de Seguridad')).toBeVisible();
    await expect(page.getByLabel('Correo Electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
    await expect(page.getByText('Regístrate aquí')).toBeVisible();
    
    // Should have safety logo
    await expect(page.locator('img[alt="Safety Logo"]')).toBeVisible();
  });



  test('should show login error for invalid credentials', async ({ page }) => {
    await authHelpers.login('invalid@email.com', 'wrongpassword');
    await authHelpers.verifyLoginError();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    // Fill password
    await page.getByLabel('Contraseña').fill('testpassword');
    
    // Password should be hidden by default
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('type', 'password');
    
    // Click visibility toggle - Material-UI IconButton in InputAdornment
    await page.locator('button[aria-label="toggle password visibility"]').click();
    
    // Password should be visible
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('type', 'text');
    
    // Click toggle again
    await page.locator('button[aria-label="toggle password visibility"]').click();
    
    // Should be hidden again
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('type', 'password');
  });

  test('should navigate to registration from login', async ({ page }) => {
    await page.goto('/login');
    
    // Click register link
    await page.getByRole('link', { name: 'Regístrate aquí' }).click();
    
    // Should navigate to registration
    await expect(page).toHaveURL(/.*register.*/);
    await expect(page.getByText('Registro de Usuario')).toBeVisible();
  });


  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    
    // Check for validation messages or that form is still visible
    const emailField = page.getByLabel('Correo Electrónico');
    const passwordField = page.getByLabel('Contraseña');
    
    // Should show validation state or remain on login page
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    
    // Additional check: verify browser validation
    const isInvalid = await emailField.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });



  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // Should display mobile layout correctly
    await expect(page.getByText('Inicio de Sesión')).toBeVisible();
    await expect(page.getByLabel('Correo Electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
  });



  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Fill valid credentials
    await page.getByLabel('Correo Electrónico').fill('admin@safety.com');
    await page.getByLabel('Contraseña').fill('test');
    
    // Simulate network failure by blocking requests
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });
    
    // Try to login
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    
    // Should handle error gracefully (may show error message or remain on login)
    await expect(page.getByText('Inicio de Sesión')).toBeVisible();
  });
});