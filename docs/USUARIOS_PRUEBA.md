# 🔑 Usuarios de Prueba - Safety App

## 📋 Accesos Rápidos

Contraseña para todos: `test`

### 🎯 **USUARIOS COMPLETOS (9 ROLES)**

| # | Rol | Nombre | Email | Espacios de Trabajo |
|---|-----|--------|-------|---------|
| 1 | **super_admin** | Carlos Rodríguez | `admin@safety.com` | Sin empresa |
| 2 | **safety_staff** | María González | `safety@alpha.com.pe` | Constructora Alpha |
| 3 | **client_supervisor** | Roberto Silva | `supervisor@alpha.com.pe` | Constructora Alpha |
| 4 | **client_approver** | Ana Torres | `approver@beta.com.pe` | Minera Beta |
| 5 | **client_staff** | Luis Mendoza | `staff@alpha.com.pe` | Constructora Alpha |
| 6 | **validadores_ops** | Sandra López | `validator@safety.com` | Sin empresa |
| 7 | **contratista_admin** | Diego Morales | `admin@gamma.com.pe` | Servicios Gamma |
| 8 | **contratista_subalternos** | Jorge Ramírez | `subalternos@gamma.com.pe` | Servicios Gamma |
| 9 | **contratista_huerfano** | Elena Vargas | `huerfano@freelance.com` | Sin empresa |

---

## 🚀 **Para Testing Rápido**

### **Copy-Paste Ready:**

**Administrador:**
```
admin@safety.com
test
```

**Safety Staff:**
```
safety@alpha.com.pe
test
```

**Client Supervisor:**
```
supervisor@alpha.com.pe
test
```

**Client Approver:**
```
approver@beta.com.pe
test
```

**Client Staff:**
```
staff@alpha.com.pe
test
```

**Validadores Ops:**
```
validator@safety.com
test
```

**Contratista Admin:**
```
admin@gamma.com.pe
test
```

**Contratista Subalternos:**
```
subalternos@gamma.com.pe
test
```

**Contratista Particular:**
```
huerfano@freelance.com
test
```

---

## 🏢 **Espacios de Trabajos en el Sistema**

1. **Constructora Alpha S.A.** (`company1`)
   - Safety Staff, Client Supervisor, Client Staff
   
2. **Minera Beta Corp** (`company2`)
   - Client Approver
   
3. **Servicios Gamma Ltda.** (`company3`)
   - Contratista Admin, Contratista Subalternos

4. **Sin Espacios de Trabajo**
   - Administrador, Validadores Ops, Contratista Particular

---

## 🔄 **Funcionalidades por Rol**

### **Administrador** (Carlos)
- Acceso total al sistema
- Gestión de todas las empresas
- Configuración global

### **Safety Staff** (María)
- Gestión de seguridad
- Aprobación de permisos
- Auditorías

### **Client Supervisor** (Roberto)
- Supervisión de equipo
- Gestión de permisos
- Reportes

### **Client Approver** (Ana)
- Aprobación de solicitudes
- Revisión de documentos
- Validaciones

### **Client Staff** (Luis)
- Operaciones básicas
- Tareas asignadas
- Reportes básicos

### **Validadores Ops** (Sandra)
- Validación de operaciones
- Inspecciones
- Control de calidad

### **Contratista Admin** (Diego)
- Gestión de contratistas
- Administración de equipo
- Permisos de trabajo

### **Contratista Subalternos** (Jorge)
- Supervisión de campo
- Reportes de progreso
- Gestión de subalternos

### **Contratista Particular** (Elena)
- Trabajador independiente
- Sin empresa asignada
- Requiere validaciones especiales

---

## ⚡ **Notas de Uso**

- **Funciona offline**: Si no hay backend, usa usuarios mock
- **Funciona online**: Se conecta con API real si está disponible
- **Dashboards específicos**: Cada rol tiene su propio dashboard
- **Datos de prueba**: Scripts disponibles para poblar BD

### **Scripts de Base de Datos:**
```bash
cd scripts
npm install
npm run seed  # Poblar con datos
npm run cleanup  # Limpiar datos
```