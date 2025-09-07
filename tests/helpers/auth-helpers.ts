import { Page, expect } from '@playwright/test';

export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Login with standard credentials
   */
  async loginWithCredentials(email: string = 'admin@safety.com', password: string = 'test') {
    await this.page.goto('/login');
    
    await this.page.getByLabel('Correo Electrónico').fill(email);
    await this.page.getByLabel('Contraseña').fill(password);
    
    // Submit login
    await this.page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    
    // Wait for dashboard
    await expect(this.page).toHaveURL(/.*dashboard.*/);
  }

  /**
   * Complete registration with custom data
   */
  async completeRegistration(data?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    cedula?: string;
    invitationCode?: string;
    ordenPatronal?: string;
    polizaINS?: string;
    password?: string;
  }) {
    await this.page.goto('/register');
    
    const testData = {
      firstName: data?.firstName || 'Test',
      lastName: data?.lastName || 'User',  
      email: data?.email || `test-${Date.now()}@playwright.com`,
      phone: data?.phone || '8888-9999',
      cedula: data?.cedula || '1-2345-6789',
      invitationCode: data?.invitationCode || '',
      ordenPatronal: data?.ordenPatronal || 'OP-TEST-001',
      polizaINS: data?.polizaINS || 'INS-TEST-123',
      password: data?.password || 'TestPass123!@#'
    };

    // Step 1: Personal Information
    await this.page.getByLabel('Nombre').fill(testData.firstName);
    await this.page.getByLabel('Apellidos').fill(testData.lastName);
    await this.page.getByLabel('Correo Electrónico').fill(testData.email);
    await this.page.getByLabel('Teléfono').fill(testData.phone);
    await this.page.getByLabel('Cédula').fill(testData.cedula);
    await this.page.getByText('Siguiente').click();

    // Step 2: Invitation Code
    if (testData.invitationCode) {
      await this.page.getByLabel('Código Temporal').fill(testData.invitationCode);
    }
    await this.page.getByText('Siguiente').click();

    // Step 3: Contractor Information
    await this.page.getByLabel('Orden Patronal').fill(testData.ordenPatronal);
    await this.page.getByLabel('Póliza INS').fill(testData.polizaINS);
    await this.page.getByText('Siguiente').click();

    // Step 4: Security
    await this.page.getByLabel('Contraseña', { exact: true }).fill(testData.password);
    await this.page.getByLabel('Confirmar Contraseña').fill(testData.password);
    
    // Accept terms
    await this.page.getByLabel('Acepto los términos y condiciones').check();
    await this.page.getByLabel('Acepto la política de privacidad').check();
    
    await this.page.getByText('Completar Registro').click();

    // Verify success
    await expect(this.page.getByText('¡Registro Exitoso!')).toBeVisible();
    
    return testData;
  }

  /**
   * Navigate to specific registration step
   */
  async goToRegistrationStep(step: 1 | 2 | 3 | 4) {
    await this.page.goto('/register');
    
    // Navigate through steps
    for (let i = 1; i < step; i++) {
      await this.page.getByText('Siguiente').click();
    }
  }

  /**
   * Verify registration step content
   */
  async verifyRegistrationStep(step: 1 | 2 | 3 | 4) {
    const stepTitles = {
      1: 'Información Personal Básica',
      2: 'Código de Invitación', 
      3: 'Información Específica del Contratista',
      4: 'Configuración de Seguridad'
    };

    await expect(this.page.getByText(stepTitles[step])).toBeVisible();
    
    const expectedProgress = (step / 4) * 100;
    await expect(this.page.getByText(`${expectedProgress}%`)).toBeVisible();
  }

  /**
   * Fill step 1 with custom data
   */
  async fillStep1(data?: {
    firstName?: string;
    lastName?: string; 
    email?: string;
    phone?: string;
    cedula?: string;
  }) {
    const stepData = {
      firstName: data?.firstName || 'Test',
      lastName: data?.lastName || 'User',
      email: data?.email || `test-${Date.now()}@playwright.com`, 
      phone: data?.phone || '8888-9999',
      cedula: data?.cedula || '1-2345-6789'
    };

    await this.page.getByLabel('Nombre').fill(stepData.firstName);
    await this.page.getByLabel('Apellidos').fill(stepData.lastName);
    await this.page.getByLabel('Correo Electrónico').fill(stepData.email);
    await this.page.getByLabel('Teléfono').fill(stepData.phone);  
    await this.page.getByLabel('Cédula').fill(stepData.cedula);
    
    return stepData;
  }

  /**
   * Verify mock data is pre-filled
   */
  async verifyMockDataPreFilled() {
    await expect(this.page.locator('input[value="Juan Carlos"]')).toBeVisible();
    await expect(this.page.locator('input[value="Pérez García"]')).toBeVisible();
    await expect(this.page.locator('input[value="juan.perez@test.com"]')).toBeVisible();
    await expect(this.page.locator('input[value="8888-9999"]')).toBeVisible();
    await expect(this.page.locator('input[value="1-1234-5678"]')).toBeVisible();
  }

  /**
   * Login with custom credentials
   */
  async login(email: string, password: string) {
    await this.page.goto('/login');
    
    await this.page.getByLabel('Correo Electrónico').fill(email);
    await this.page.getByLabel('Contraseña').fill(password);
    
    await this.page.getByText('Iniciar Sesión').click();
  }

  /**
   * Verify login error
   */
  async verifyLoginError(expectedError: string = 'Email o contraseña incorrectos') {
    await expect(this.page.getByText(expectedError)).toBeVisible();
  }

  /**
   * Verify successful login (redirected to dashboard)
   */
  async verifySuccessfulLogin() {
    await expect(this.page).toHaveURL(/.*dashboard.*/);
  }
}