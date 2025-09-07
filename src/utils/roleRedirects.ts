import { UserRole } from '../types';

// Función para obtener la primera ruta disponible para cada rol
export const getDefaultRouteForRole = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/system-users'; // Primera opción: Usuarios
    
    case UserRole.SAFETY_STAFF:
      return '/system-users'; // Primera opción: Usuarios
    
    case UserRole.CLIENT_SUPERVISOR:
      return '/company-users'; // Primera opción: Usuarios
    
    case UserRole.CLIENT_APPROVER:
      return '/contractors'; // Primera opción: Contratistas
    
    case UserRole.CLIENT_STAFF:
      return '/courses'; // Primera opción: Mis Tareas
    
    case UserRole.VALIDADORES_OPS:
      return '/contractor-search'; // Primera opción: Validación de Acceso
    
    case UserRole.CONTRATISTA_ADMIN:
      return '/contractors'; // Primera opción: Mis Equipos
    
    case UserRole.CONTRATISTA_SUBALTERNOS:
      return '/work-permits'; // Primera opción: Mis Tareas
    
    case UserRole.CONTRATISTA_HUERFANO:
      return '/work-permits'; // Primera opción: Mis Tareas
    
    default:
      return '/dashboard'; // Fallback por defecto
  }
};