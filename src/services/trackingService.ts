import { CookieConsents } from '../components/CookieConsent';

// Configuración de Google Tag Manager
const GTM_ID = process.env.REACT_APP_GTM_ID || 'GTM-NLLQRHPS';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'consent' | 'event',
      targetId: string | 'default',
      config?: any
    ) => void;
    dataLayer: any[];
  }
}

class TrackingService {
  private isInitialized = false;
  private currentConsents: CookieConsents | null = null;

  /**
   * Inicializa el tracking service (GTM ya se carga desde HTML)
   */
  initializeGTM(): void {
    if (this.isInitialized) return;

    // Verificar que dataLayer exista (debería existir por GTM en HTML)
    window.dataLayer = window.dataLayer || [];
    
    // Función gtag para compatibility
    window.gtag = window.gtag || function gtag(...args: any[]) {
      window.dataLayer.push(args);
    };

    // Configuración inicial con consentimiento denegado por defecto
    window.gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'functionality_storage': 'denied',
      'personalization_storage': 'denied'
    });

    this.isInitialized = true;
    console.log('Tracking Service initialized - GTM loaded from HTML');
  }

  /**
   * Actualiza el consentimiento basado en las preferencias del usuario
   */
  updateConsent(consents: CookieConsents): void {
    if (!this.isInitialized) {
      this.initializeGTM();
    }

    this.currentConsents = consents;

    // Actualizar consentimiento en GTM
    window.gtag('consent', 'update', {
      'analytics_storage': consents.analytics ? 'granted' : 'denied',
      'ad_storage': consents.marketing ? 'granted' : 'denied',
      'functionality_storage': consents.preferences ? 'granted' : 'denied',
      'personalization_storage': consents.marketing ? 'granted' : 'denied'
    });

    // Enviar evento de consentimiento actualizado
    this.trackEvent('consent_update', {
      analytics: consents.analytics,
      marketing: consents.marketing,
      preferences: consents.preferences,
      timestamp: new Date().toISOString()
    });

    console.log('Consent updated:', consents);
  }

  /**
   * Rastrea un evento personalizado
   */
  trackEvent(eventName: string, parameters: Record<string, any> = {}): void {
    if (!this.isInitialized || !this.currentConsents?.analytics) {
      console.log('Tracking disabled or not consented:', eventName);
      return;
    }

    window.gtag('event', eventName, {
      ...parameters,
      event_category: 'engagement',
      event_timestamp: Date.now()
    });

    console.log('Event tracked:', eventName, parameters);
  }

  /**
   * Rastrea navegación de página
   */
  trackPageView(page: string, title?: string): void {
    if (!this.isInitialized || !this.currentConsents?.analytics) {
      return;
    }

    window.gtag('config', GTM_ID, {
      page_path: page,
      page_title: title || document.title
    });

    console.log('Page view tracked:', page);
  }

  /**
   * Rastrea interacciones del usuario
   */
  trackUserAction(action: string, category: string = 'user_interaction', label?: string): void {
    this.trackEvent('user_action', {
      action,
      category,
      label,
      page: window.location.pathname
    });
  }

  /**
   * Rastrea errores
   */
  trackError(error: string, context?: string): void {
    this.trackEvent('error', {
      error_message: error,
      error_context: context || 'unknown',
      page: window.location.pathname
    });
  }

  /**
   * Rastrea eventos de registro/autenticación
   */
  trackAuthEvent(event: 'login' | 'register' | 'logout', method?: string): void {
    this.trackEvent(event, {
      method: method || 'email',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Rastrea formularios
   */
  trackFormEvent(
    formName: string, 
    event: 'start' | 'submit' | 'error' | 'complete',
    step?: number,
    errors?: string[]
  ): void {
    this.trackEvent('form_interaction', {
      form_name: formName,
      form_event: event,
      form_step: step,
      form_errors: errors?.join(','),
      page: window.location.pathname
    });
  }

  /**
   * Rastrea tiempo en página
   */
  trackTimeOnPage(page: string, timeSpent: number): void {
    this.trackEvent('time_on_page', {
      page,
      time_spent_seconds: Math.round(timeSpent / 1000),
      page_url: window.location.href
    });
  }

  /**
   * Obtiene el consentimiento actual
   */
  getCurrentConsents(): CookieConsents | null {
    return this.currentConsents;
  }

  /**
   * Verifica si el tracking está habilitado
   */
  isTrackingEnabled(): boolean {
    return this.isInitialized && !!this.currentConsents?.analytics;
  }

  /**
   * Carga consentimientos guardados desde localStorage
   */
  loadSavedConsents(): CookieConsents | null {
    try {
      const saved = localStorage.getItem('cookie-consent');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.consents;
      }
    } catch (error) {
      console.error('Error loading saved consents:', error);
    }
    return null;
  }

  /**
   * Inicializa el servicio con consentimientos guardados
   */
  initialize(): void {
    this.initializeGTM();
    
    const savedConsents = this.loadSavedConsents();
    if (savedConsents) {
      this.updateConsent(savedConsents);
    }
  }
}

export const trackingService = new TrackingService();
export default trackingService;