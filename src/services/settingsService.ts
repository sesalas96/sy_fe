import { 
  UserSettings, 
  SystemSettings, 
  AuditLog,
  NotificationSettings,
  BrandingSettings,
  PolicySettings
} from '../types';

// Interface local para settings de la empresa del sistema
interface SystemCompanySettings {
  id: string;
  companyId: string;
  branding: BrandingSettings;
  policies: PolicySettings;
  features: {
    enableContractorManagement: boolean;
    enableCourseTracking: boolean;
    enableWorkPermits: boolean;
    enableNotifications: boolean;
    enableReporting: boolean;
    enableMultiCompany: boolean;
    enableAPIAccess: boolean;
    enableMobileApp: boolean;
  };
  contactInfo: {
    supportEmail: string;
    supportPhone: string;
    address: string;
    website: string;
  };
  businessHours: {
    timezone: string;
    workingDays: string[];
    startTime: string;
    endTime: string;
  };
  updatedAt: Date;
}

// Mock API delay simulation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock settings data
let mockUserSettings: UserSettings = {
  id: '1',
  userId: 'user1',
  theme: 'light',
  language: 'es',
  timezone: 'America/Costa_Rica',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  notifications: {
    email: true,
    push: true,
    sms: false,
    courseExpiring: true,
    documentExpiring: true,
    permitExpiring: true,
    workReminders: true,
    systemAlerts: true,
    dailyDigest: false
  },
  dashboard: {
    defaultView: 'overview',
    refreshInterval: 5,
    showWelcomeMessage: true,
    compactMode: false,
    widgetOrder: ['stats', 'activities', 'notifications'],
    hideCompletedTasks: false
  },
  updatedAt: new Date()
};

let mockSystemCompanySettings: SystemCompanySettings = {
  id: '1',
  companyId: 'company1',
  branding: {
    primaryColor: '#3462C7',
    secondaryColor: '#678966',
    companyName: 'Constructora ABC S.A.',
    customCSS: ''
  },
  policies: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    sessionTimeout: 480,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    requireTwoFactor: false,
    allowRememberMe: true
  },
  features: {
    enableContractorManagement: true,
    enableCourseTracking: true,
    enableWorkPermits: true,
    enableNotifications: true,
    enableReporting: true,
    enableMultiCompany: false,
    enableAPIAccess: true,
    enableMobileApp: false
  },
  contactInfo: {
    supportEmail: 'info@constructoraabc.com',
    supportPhone: '+506 2234-5678',
    address: 'San José, Costa Rica',
    website: 'https://www.constructoraabc.com'
  },
  businessHours: {
    timezone: 'America/Costa_Rica',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '17:00'
  },
  updatedAt: new Date()
};

let mockSystemSettings: SystemSettings = {
  id: '1',
  security: {
    enableAuditLog: true,
    logRetention: 90,
    enableRateLimiting: true,
    allowConcurrentSessions: false,
    requireHttps: true
  },
  integrations: {
    emailProvider: {
      enabled: true,
      provider: 'smtp',
      config: {}
    },
    smsProvider: {
      enabled: false,
      provider: 'twilio',
      config: {}
    },
    storageProvider: {
      provider: 'local',
      config: {}
    },
    backupSchedule: {
      enabled: true,
      frequency: 'daily',
      retention: 30
    }
  },
  maintenance: {
    enableMaintenanceMode: false,
    maintenanceMessage: 'Sistema en mantenimiento. Regrese pronto.'
  },
  updatedAt: new Date()
};

// Mock audit logs
let mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: 'user1',
    action: 'LOGIN',
    resourceType: 'AUTH',
    details: { success: true },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2024-07-14T09:30:00')
  },
  {
    id: '2',
    userId: 'user2',
    action: 'CREATE_PERMIT',
    resourceType: 'WORK_PERMIT',
    resourceId: 'permit-123',
    details: { description: 'Trabajo en altura' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2024-07-14T10:15:00')
  }
];

export interface UserProfileUpdate {
  name?: string;
  email?: string;
  language?: 'es' | 'en';
  timezone?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  borderRadius: number;
  compactMode: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export class SettingsService {
  /**
   * Get user settings
   */
  static async getUserSettings(userId?: string): Promise<UserSettings> {
    await delay(200);
    return { ...mockUserSettings };
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    await delay(500);

    mockUserSettings = {
      ...mockUserSettings,
      ...settings,
      updatedAt: new Date()
    };

    return { ...mockUserSettings };
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(userId: string, profile: UserProfileUpdate): Promise<void> {
    await delay(500);

    // TODO: Update user profile in backend
    console.log('Updating user profile:', { userId, profile });
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(
    userId: string, 
    notifications: NotificationSettings
  ): Promise<UserSettings> {
    await delay(400);

    mockUserSettings = {
      ...mockUserSettings,
      notifications,
      updatedAt: new Date()
    };

    return { ...mockUserSettings };
  }

  /**
   * Apply theme settings
   */
  static async applyThemeSettings(themeSettings: ThemeSettings): Promise<void> {
    await delay(300);

    // Update user settings
    mockUserSettings = {
      ...mockUserSettings,
      theme: themeSettings.mode,
      updatedAt: new Date()
    };

    // Apply theme to DOM
    document.documentElement.style.setProperty('--primary-color', themeSettings.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', themeSettings.secondaryColor);
    document.documentElement.style.setProperty('--border-radius', `${themeSettings.borderRadius}px`);
    
    if (themeSettings.fontSize) {
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      document.documentElement.style.setProperty('--font-size', fontSizeMap[themeSettings.fontSize]);
    }

    // Store theme in localStorage for persistence
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }

  /**
   * Get company settings
   */
  static async getSystemCompanySettings(companyId?: string): Promise<SystemCompanySettings> {
    await delay(200);
    return { ...mockSystemCompanySettings };
  }

  /**
   * Update company settings
   */
  static async updateSystemCompanySettings(settings: Partial<SystemCompanySettings>): Promise<SystemCompanySettings> {
    await delay(600);

    mockSystemCompanySettings = {
      ...mockSystemCompanySettings,
      ...settings,
      updatedAt: new Date()
    };

    return { ...mockSystemCompanySettings };
  }

  /**
   * Update company branding
   */
  static async updateCompanyBranding(branding: BrandingSettings): Promise<SystemCompanySettings> {
    await delay(500);

    mockSystemCompanySettings = {
      ...mockSystemCompanySettings,
      branding,
      updatedAt: new Date()
    };

    return { ...mockSystemCompanySettings };
  }

  /**
   * Upload company logo
   */
  static async uploadCompanyLogo(file: File): Promise<string> {
    await delay(1000);

    // TODO: Implement actual file upload
    const logoUrl = URL.createObjectURL(file);
    
    mockSystemCompanySettings.branding.logo = logoUrl;
    mockSystemCompanySettings.updatedAt = new Date();

    return logoUrl;
  }

  /**
   * Get system settings (admin only)
   */
  static async getSystemSettings(): Promise<SystemSettings> {
    await delay(200);
    return { ...mockSystemSettings };
  }

  /**
   * Update system settings (admin only)
   */
  static async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    await delay(600);

    mockSystemSettings = {
      ...mockSystemSettings,
      ...settings,
      updatedAt: new Date()
    };

    return { ...mockSystemSettings };
  }

  /**
   * Update security policies
   */
  static async updateSecurityPolicies(policies: PolicySettings): Promise<void> {
    await delay(500);

    mockSystemCompanySettings = {
      ...mockSystemCompanySettings,
      policies,
      updatedAt: new Date()
    };
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(
    filters?: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AuditLog[]> {
    await delay(300);

    let filtered = [...mockAuditLogs];

    if (filters?.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    if (filters?.action) {
      filtered = filtered.filter(log => log.action.includes(filters.action!));
    }

    if (filters?.resourceType) {
      filtered = filtered.filter(log => log.resourceType === filters.resourceType);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(logEntry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    await delay(100);

    const newLog: AuditLog = {
      ...logEntry,
      id: (mockAuditLogs.length + 1).toString(),
      timestamp: new Date()
    };

    mockAuditLogs.unshift(newLog);

    // Keep only recent logs to prevent memory issues
    if (mockAuditLogs.length > 1000) {
      mockAuditLogs = mockAuditLogs.slice(0, 1000);
    }
  }

  /**
   * Export settings for backup
   */
  static async exportSettings(): Promise<{
    userSettings: UserSettings;
    companySettings: SystemCompanySettings;
    systemSettings: SystemSettings;
    exportDate: Date;
  }> {
    await delay(800);

    return {
      userSettings: { ...mockUserSettings },
      companySettings: { ...mockSystemCompanySettings },
      systemSettings: { ...mockSystemSettings },
      exportDate: new Date()
    };
  }

  /**
   * Import settings from backup
   */
  static async importSettings(settingsData: {
    userSettings?: Partial<UserSettings>;
    companySettings?: Partial<SystemCompanySettings>;
    systemSettings?: Partial<SystemSettings>;
  }): Promise<void> {
    await delay(1000);

    if (settingsData.userSettings) {
      mockUserSettings = {
        ...mockUserSettings,
        ...settingsData.userSettings,
        updatedAt: new Date()
      };
    }

    if (settingsData.companySettings) {
      mockSystemCompanySettings = {
        ...mockSystemCompanySettings,
        ...settingsData.companySettings,
        updatedAt: new Date()
      };
    }

    if (settingsData.systemSettings) {
      mockSystemSettings = {
        ...mockSystemSettings,
        ...settingsData.systemSettings,
        updatedAt: new Date()
      };
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetToDefaults(type: 'user' | 'company' | 'system'): Promise<void> {
    await delay(400);

    switch (type) {
      case 'user':
        mockUserSettings = {
          ...mockUserSettings,
          theme: 'light',
          language: 'es',
          timezone: 'America/Costa_Rica',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          notifications: {
            email: true,
            push: true,
            sms: false,
            courseExpiring: true,
            documentExpiring: true,
            permitExpiring: true,
            workReminders: true,
            systemAlerts: true,
            dailyDigest: false
          },
          dashboard: {
            defaultView: 'overview',
            refreshInterval: 5,
            showWelcomeMessage: true,
            compactMode: false,
            widgetOrder: ['stats', 'activities', 'notifications'],
            hideCompletedTasks: false
          },
          updatedAt: new Date()
        };
        break;
      
      case 'company':
        // Reset company settings to defaults
        mockSystemCompanySettings.branding.primaryColor = '#3462C7';
        mockSystemCompanySettings.branding.secondaryColor = '#678966';
        mockSystemCompanySettings.updatedAt = new Date();
        break;
      
      case 'system':
        // Reset system settings to defaults
        mockSystemSettings.security.enableAuditLog = true;
        mockSystemSettings.security.logRetention = 90;
        mockSystemSettings.updatedAt = new Date();
        break;
    }
  }

  /**
   * Test configuration (e.g., email settings)
   */
  static async testConfiguration(type: 'email' | 'sms' | 'backup'): Promise<{
    success: boolean;
    message: string;
  }> {
    await delay(2000); // Simulate longer test

    // Simulate test results
    const testResults = {
      email: { success: true, message: 'Configuración de email válida' },
      sms: { success: false, message: 'Error: Credenciales SMS inválidas' },
      backup: { success: true, message: 'Configuración de respaldo funcionando' }
    };

    return testResults[type];
  }
}

export default SettingsService;