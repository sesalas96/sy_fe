# Scripts de Base de Datos - Safety App

Este directorio contiene scripts para gestionar los datos de la base de datos de Safety App.

## 📋 Scripts Disponibles

### 🌱 Seed Database (`seed-database.js`)
Pobla la base de datos con datos de ejemplo realistas.

```bash
# Ejecutar seed
node seed-database.js
# o
npm run seed
```

**Datos que crea:**
- 3 empresas (Constructora, Minera, Servicios)
- 9 usuarios con TODOS los roles del sistema
- 4 contratistas con certificaciones
- 4 permisos de trabajo en diferentes estados
- 8 actividades del sistema
- 8 alertas de diferentes tipos

### 🧹 Cleanup Database (`cleanup-database.js`)
Limpia todas las colecciones de la base de datos.

```bash
# Limpieza interactiva (con confirmación)
node cleanup-database.js

# Limpieza rápida (sin confirmación)
node cleanup-database.js --quick
npm run cleanup:quick

# Limpiar solo una colección
node cleanup-database.js --collection users

# Reset completo (eliminar colecciones)
node cleanup-database.js --full-reset

# Ver ayuda
node cleanup-database.js --help
```

### 🔄 Comandos Combinados

```bash
# Limpiar y poblar de nuevo
npm run seed:fresh
```

## 🔑 Usuarios de Prueba

El script de seed crea usuarios con TODOS los 9 roles del sistema:

| Email | Rol | Contraseña | Espacios de Trabajo |
|-------|-----|------------|---------|
| `admin@safety.com` | super_admin | test | - |
| `safety@alpha.com.pe` | safety_staff | test | Constructora Alpha |
| `supervisor@alpha.com.pe` | client_supervisor | test | Constructora Alpha |
| `approver@beta.com.pe` | client_approver | test | Minera Beta |
| `staff@alpha.com.pe` | client_staff | test | Constructora Alpha |
| `validator@safety.com` | validadores_ops | test | - |
| `admin@gamma.com.pe` | contratista_admin | test | Servicios Gamma |
| `subalternos@gamma.com.pe` | contratista_subalternos | test | Servicios Gamma |
| `huerfano@freelance.com` | contratista_huerfano | test | Sin empresa |

## 📊 Escenarios de Datos

### Espacios de Trabajos
- **Constructora Alpha S.A.**: Espacios de Trabajo de construcción con múltiples proyectos
- **Minera Beta Corp**: Operaciones mineras con alta regulación
- **Servicios Gamma Ltda.**: Servicios de mantenimiento industrial

### Contratistas
- **Juan Pérez**: Técnico con certificación expirada (genera alertas)
- **Patricia Vega**: Operaria activa en minería
- **Miguel Castillo**: Técnico eléctrico nuevo
- **Carmen Ruiz**: Soldadora con certificación próxima a vencer

### Permisos de Trabajo
- **PT-2024-001**: Mantenimiento eléctrico (en progreso)
- **PT-2024-002**: Soldadura (aprobado)
- **PT-2024-003**: Inspección (pendiente)
- **PT-2024-004**: Limpieza tanques (cancelado)

### Alertas
- Certificaciones próximas a vencer
- Certificaciones expiradas
- Permisos próximos a vencer
- Nuevos registros
- Entrenamientos completados
- Permisos rechazados
- Mantenimiento de equipos

## 🔧 Configuración

### Variables de Entorno
```bash
MONGODB_URI=mongodb://localhost:27017/safety-app
```

### Dependencias
```bash
cd scripts
npm install
```

## ⚠️ Advertencias

- **El script de limpieza eliminará TODOS los datos**
- Siempre hacer backup antes de ejecutar cleanup
- Los scripts están diseñados para entorno de desarrollo
- Para producción, usar migraciones apropiadas

## 🗂️ Colecciones Gestionadas

- `companies` - Espacios de Trabajos
- `users` - Usuarios del sistema
- `contractors` - Contratistas
- `workpermits` - Permisos de trabajo
- `activities` - Actividades del sistema
- `alerts` - Alertas y notificaciones
- `notifications` - Notificaciones
- `courses` - Cursos de capacitación
- `certifications` - Certificaciones
- `reports` - Reportes
- `settings` - Configuraciones
- `logs` - Logs del sistema

## 📈 Casos de Uso

### Desarrollo
```bash
# Setup inicial
npm run seed

# Reset durante desarrollo
npm run seed:fresh
```

### Testing
```bash
# Limpiar antes de tests
npm run cleanup:quick

# Poblar con datos de test
npm run seed
```

### Debugging
```bash
# Limpiar solo una tabla problemática
node cleanup-database.js --collection activities

# Ver estado actual
node cleanup-database.js --help
```