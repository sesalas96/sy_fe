import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackingService } from '../services/trackingService';

export const useTracking = () => {
  const location = useLocation();

  // Rastrea cambios de página automáticamente
  useEffect(() => {
    trackingService.trackPageView(location.pathname);
  }, [location]);

  // Rastrea tiempo en página
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const timeSpent = Date.now() - startTime;
      if (timeSpent > 5000) { // Solo si estuvo más de 5 segundos
        trackingService.trackTimeOnPage(location.pathname, timeSpent);
      }
    };
  }, [location.pathname]);

  // Funciones de tracking disponibles para componentes
  const track = {
    event: useCallback((eventName: string, parameters?: Record<string, any>) => {
      trackingService.trackEvent(eventName, parameters);
    }, []),

    userAction: useCallback((action: string, category?: string, label?: string) => {
      trackingService.trackUserAction(action, category, label);
    }, []),

    formEvent: useCallback((
      formName: string, 
      event: 'start' | 'submit' | 'error' | 'complete',
      step?: number,
      errors?: string[]
    ) => {
      trackingService.trackFormEvent(formName, event, step, errors);
    }, []),

    auth: useCallback((event: 'login' | 'register' | 'logout', method?: string) => {
      trackingService.trackAuthEvent(event, method);
    }, []),

    error: useCallback((error: string, context?: string) => {
      trackingService.trackError(error, context);
    }, []),

    buttonClick: useCallback((buttonName: string, context?: string) => {
      trackingService.trackUserAction('button_click', 'interaction', `${buttonName}${context ? `_${context}` : ''}`);
    }, []),

    formSubmit: useCallback((formName: string, success: boolean, errors?: string[]) => {
      const event = success ? 'complete' : 'error';
      trackingService.trackFormEvent(formName, event, undefined, errors);
    }, [])
  };

  return {
    track,
    isTrackingEnabled: trackingService.isTrackingEnabled(),
    getCurrentConsents: trackingService.getCurrentConsents()
  };
};

export default useTracking;