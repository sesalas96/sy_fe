# Configuración de Google Tag Manager para Safety App

## 1. Tags a crear en GTM

### Tag 1: GA4 - Page Views
- **Tipo**: Google Analytics: GA4 Configuration
- **Measurement ID**: Tu GA4 Measurement ID (G-XXXXXXXX)  
- **Trigger**: All Pages
- **Configuraciones adicionales**:
  - Enhanced Measurement: Habilitado
  - Send page_view events: Habilitado

### Tag 2: GA4 - Custom Events
- **Tipo**: Google Analytics: GA4 Event
- **Configuration Tag**: Seleccionar el tag GA4 Configuration creado arriba
- **Event Name**: `{{Event}}`
- **Event Parameters**:
  - `event_category`: `{{Event Category}}`
  - `event_timestamp`: `{{Event Timestamp}}`
  - `page_path`: `{{Page Path}}`
  - `user_role`: `{{User Role}}`
  - `company`: `{{Company}}`
- **Trigger**: Custom Event Trigger (ver abajo)

### Tag 3: Console Debug (opcional)
- **Tipo**: Custom HTML
- **HTML**:
```html
<script>
console.log('GTM Event:', {{Event}}, {{Event Category}}, {{Event Timestamp}});
</script>
```
- **Trigger**: Custom Event Trigger

## 2. Triggers a crear

### Trigger 1: All Pages
- **Tipo**: Page View
- **Nombre**: All Pages
- **Se dispara en**: All Page Views

### Trigger 2: Custom Event Trigger  
- **Tipo**: Custom Event
- **Nombre**: Custom Events
- **Event name**: `.*` (regex para capturar todos los eventos)

### Trigger 3: Login Events
- **Tipo**: Custom Event
- **Nombre**: Login Events
- **Event name**: `login|login_success`

### Trigger 4: Registration Events
- **Tipo**: Custom Event
- **Nombre**: Registration Events  
- **Event name**: `register|registration_complete|registration_step_completed`

### Trigger 5: Error Events
- **Tipo**: Custom Event
- **Nombre**: Error Events
- **Event name**: `error|login_failed|registration_step_error`

## 3. Variables a crear

### Built-in Variables (habilitar en Variables > Configure)
- [x] Click Element
- [x] Click Classes  
- [x] Click ID
- [x] Click Target
- [x] Click Text
- [x] Click URL
- [x] Form Element
- [x] Form Classes
- [x] Form ID
- [x] Form Target
- [x] Form Text
- [x] Form URL
- [x] Page Hostname
- [x] Page Path
- [x] Page URL
- [x] Referrer

### Variables personalizadas:

#### Variable 1: Event Category
- **Tipo**: Data Layer Variable
- **Nombre**: Event Category
- **Data Layer Variable Name**: `event_category`

#### Variable 2: Event Timestamp
- **Tipo**: Data Layer Variable
- **Nombre**: Event Timestamp  
- **Data Layer Variable Name**: `event_timestamp`

#### Variable 3: User Role
- **Tipo**: Data Layer Variable
- **Nombre**: User Role
- **Data Layer Variable Name**: `user_role`

#### Variable 4: Company
- **Tipo**: Data Layer Variable
- **Nombre**: Company
- **Data Layer Variable Name**: `company`

#### Variable 5: Session ID
- **Tipo**: Data Layer Variable
- **Nombre**: Session ID
- **Data Layer Variable Name**: `session_id`

#### Variable 6: Form Name
- **Tipo**: Data Layer Variable
- **Nombre**: Form Name
- **Data Layer Variable Name**: `form_name`

#### Variable 7: Error Message
- **Tipo**: Data Layer Variable
- **Nombre**: Error Message
- **Data Layer Variable Name**: `error_message`

## 4. Eventos que la app enviará automáticamente

### Eventos de autenticación:
- `login` - Usuario inicia sesión
- `login_success` - Login exitoso con detalles
- `login_failed` - Error en login
- `register` - Usuario completa registro
- `logout` - Usuario cierra sesión

### Eventos de registro:
- `registration_complete` - Registro completado
- `registration_step_completed` - Paso de registro completado
- `registration_step_error` - Error en paso de registro

### Eventos de formularios:
- `form_interaction` - Interacciones con formularios
- `user_action` - Acciones del usuario (clicks, etc.)

### Eventos de página:
- `page_view` - Navegación automática
- `time_on_page` - Tiempo en página (>5 segundos)

### Eventos de consentimiento:
- `consent_update` - Actualización de consentimientos de cookies

### Eventos de errores:
- `error` - Errores generales de la aplicación

## 5. Parámetros comunes enviados

Cada evento incluye algunos de estos parámetros:
- `event_category`: Categoría del evento
- `event_timestamp`: Timestamp del evento
- `page`: Página actual
- `user_role`: Rol del usuario (si está logueado)
- `company`: Espacios de Trabajo del usuario
- `session_id`: ID de sesión de registro
- `form_name`: Nombre del formulario
- `form_step`: Paso del formulario
- `error_message`: Mensaje de error
- `error_context`: Contexto del error

## 6. Configuración de Google Analytics 4

En GA4, crea estos eventos personalizados:
1. `login_success` - Conversión
2. `registration_complete` - Conversión  
3. `form_interaction` - Engagement
4. `user_action` - Engagement
5. `error` - Para debugging

## 7. Testing y Debug

1. **Preview Mode**: Usa el Preview Mode de GTM con `http://localhost:3001`
2. **Real Time**: En GA4, ve a Reports > Realtime para ver eventos en vivo
3. **DebugView**: En GA4, habilita DebugView para debugging detallado
4. **Console Logs**: La app muestra logs en console del navegador

## 8. Métricas recomendadas para dashboards

### Engagement:
- Page views por sesión
- Tiempo promedio en página  
- Bounce rate por página

### Conversiones:
- Tasa de registro completado
- Abandono por paso de registro
- Tasa de login exitoso

### Errores:
- Errores por página
- Errores por tipo de usuario
- Patrones de errores por tiempo

### Usuarios:
- Usuarios por rol
- Usuarios por empresa
- Actividad por hora/día