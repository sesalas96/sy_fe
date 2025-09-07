# Dashboard API Specifications by Role

## Overview
This document defines the API data requirements for each user role's dashboard in the Safety Management System.

## API Endpoint Structure

### Base Endpoints
- `GET /api/dashboard/stats` - Returns role-specific statistics
- `GET /api/dashboard/activities` - Returns recent activities with pagination
- `GET /api/dashboard/alerts` - Returns alerts filtered by type
- `PUT /api/dashboard/alerts/{id}/read` - Marks alert as read

## Role-Specific API Requirements

### 1. SUPER_ADMIN - System Administrator

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "totalCompanies": 150,
  "totalUsers": 1250,
  "activeSubscriptions": 125,
  "totalRevenue": 125000,
  "systemUptime": 99.9,
  "apiRequests": 50000,
  "newCompaniesThisMonth": 12,
  "activeUsersToday": 450,
  "systemHealth": {
    "database": "healthy",
    "apiServer": "healthy",
    "storageUsage": 65,
    "memoryUsage": 45
  }
}
```

**Endpoint:** `GET /api/dashboard/activities`
```json
{
  "activities": [
    {
      "id": "act_001",
      "type": "company_registration",
      "message": "Nueva empresa ABC Corp registrada",
      "timestamp": "2024-01-20T10:30:00Z",
      "userId": "user_123",
      "userName": "Admin User",
      "severity": "info",
      "metadata": {
        "companyId": "comp_123",
        "companyName": "ABC Corp"
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### 2. SAFETY_STAFF - Safety Department Staff

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "activeContractors": 450,
  "pendingPermits": 25,
  "expiringDocuments": 12,
  "completedCourses": 180,
  "pendingApprovals": 8,
  "complianceRate": 87.5,
  "riskAssessments": {
    "high": 5,
    "medium": 15,
    "low": 30
  },
  "incidentsThisMonth": 3,
  "inspectionsScheduled": 12
}
```

**Endpoint:** `GET /api/dashboard/alerts`
```json
{
  "alerts": [
    {
      "id": "alert_001",
      "type": "document_expiring",
      "title": "Documento próximo a vencer",
      "message": "Póliza de seguro de Juan Pérez vence en 15 días",
      "priority": "high",
      "read": false,
      "createdAt": "2024-01-20T08:00:00Z",
      "contractorId": "cont_123",
      "contractorName": "Juan Pérez",
      "documentType": "insurance_policy",
      "expiryDate": "2024-02-04"
    }
  ],
  "unreadCount": 5,
  "total": 20
}
```

### 3. CLIENT_SUPERVISOR - Client Company Supervisor

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "totalContractors": 75,
  "activePermits": 12,
  "complianceRate": 92.3,
  "pendingApprovals": 5,
  "monthlyGrowth": 15.2,
  "contractorsByStatus": {
    "active": 65,
    "inactive": 8,
    "suspended": 2
  },
  "departmentStats": {
    "maintenance": 25,
    "construction": 30,
    "cleaning": 20
  },
  "trainingCompletion": 85.5
}
```

**Endpoint:** `GET /api/dashboard/contractors`
```json
{
  "contractors": [
    {
      "id": "cont_001",
      "name": "Juan Pérez",
      "cedula": "123456789",
      "company": "Constructora ABC",
      "status": "active",
      "complianceScore": 95,
      "activePermits": 2,
      "lastAccess": "2024-01-20T09:00:00Z",
      "courses": {
        "completed": 5,
        "pending": 1,
        "expired": 0
      },
      "documents": {
        "valid": 8,
        "expiring": 1,
        "expired": 0
      }
    }
  ],
  "total": 75,
  "page": 1,
  "limit": 20
}
```

### 4. CLIENT_APPROVER - Client HSE Approver

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "pendingApprovals": 12,
  "approvedToday": 5,
  "rejectedToday": 2,
  "avgResponseTime": 2.5,
  "approvalsByType": {
    "work_permit": 6,
    "access_request": 4,
    "document_validation": 2
  },
  "departmentDistribution": {
    "maintenance": 5,
    "operations": 4,
    "administration": 3
  }
}
```

**Endpoint:** `GET /api/dashboard/approvals`
```json
{
  "approvals": [
    {
      "id": "appr_001",
      "type": "work_permit",
      "title": "Trabajo en altura - Torre Este",
      "contractorName": "Pedro González",
      "contractorId": "cont_002",
      "requestDate": "2024-01-20T08:00:00Z",
      "priority": "high",
      "department": "Mantenimiento",
      "description": "Reparación de antena en torre este",
      "riskLevel": "high",
      "documents": [
        {
          "type": "risk_assessment",
          "status": "approved"
        },
        {
          "type": "insurance",
          "status": "valid"
        }
      ],
      "requiredApprovals": [
        {
          "department": "Safety",
          "status": "approved"
        },
        {
          "department": "Operations",
          "status": "pending"
        }
      ]
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10
}
```

### 5. CLIENT_STAFF - Client Staff Member

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "completedCourses": 8,
  "activeCourses": 2,
  "certificatesEarned": 6,
  "overallProgress": 80,
  "nextCertificationExpiry": "2024-06-15",
  "hoursCompleted": 45,
  "complianceStatus": "compliant",
  "upcomingDeadlines": 3
}
```

**Endpoint:** `GET /api/dashboard/courses`
```json
{
  "courses": [
    {
      "id": "course_001",
      "name": "Seguridad Industrial Básica",
      "progress": 85,
      "status": "in_progress",
      "dueDate": "2024-02-15",
      "lastAccessed": "2024-01-19T14:30:00Z",
      "duration": 8,
      "modules": {
        "total": 10,
        "completed": 8
      },
      "certificateUrl": null
    }
  ],
  "tasks": [
    {
      "id": "task_001",
      "type": "course_completion",
      "title": "Completar módulo de EPP",
      "dueDate": "2024-01-25",
      "priority": "medium",
      "courseId": "course_001"
    }
  ]
}
```

### 6. VALIDADORES_OPS - Security/Access Validator

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "pendingVerifications": 8,
  "accessesGranted": 125,
  "incidentsReported": 2,
  "toolsRegistered": 45,
  "todayStats": {
    "entrances": 85,
    "exits": 73,
    "currentInside": 12,
    "violations": 1
  },
  "vehicleAccess": {
    "pending": 3,
    "approved": 42,
    "inPremises": 15
  }
}
```

**Endpoint:** `GET /api/dashboard/access-requests`
```json
{
  "requests": [
    {
      "id": "access_001",
      "contractorName": "María Rodríguez",
      "contractorId": "cont_003",
      "cedula": "987654321",
      "company": "Limpieza Pro",
      "area": "Edificio A - Piso 3",
      "purpose": "Limpieza de oficinas",
      "requestTime": "2024-01-20T07:45:00Z",
      "validFrom": "2024-01-20T08:00:00Z",
      "validUntil": "2024-01-20T17:00:00Z",
      "status": "pending",
      "documents": {
        "insurance": "valid",
        "courses": "valid",
        "permit": "approved"
      },
      "tools": ["Carrito de limpieza", "Aspiradora"],
      "approvals": {
        "safety": "approved",
        "area_supervisor": "pending"
      }
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 10
}
```

### 7. CONTRATISTA_ADMIN - Contractor Company Administrator

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "teamMembers": 25,
  "activePermits": 8,
  "completedTrainings": 120,
  "pendingTasks": 15,
  "companyCompliance": 88.5,
  "teamStats": {
    "active": 20,
    "onLeave": 3,
    "suspended": 2
  },
  "trainingStats": {
    "completed": 120,
    "inProgress": 18,
    "overdue": 5
  },
  "documentStats": {
    "valid": 145,
    "expiring": 12,
    "expired": 3
  }
}
```

**Endpoint:** `GET /api/dashboard/team`
```json
{
  "members": [
    {
      "id": "member_001",
      "name": "Carlos Méndez",
      "cedula": "123123123",
      "position": "Técnico Eléctrico",
      "status": "active",
      "complianceScore": 92,
      "activePermits": 2,
      "lastAccess": "2024-01-20T08:30:00Z",
      "training": {
        "completed": 8,
        "pending": 1,
        "overdue": 0
      },
      "documents": {
        "insurance": "valid",
        "ordenPatronal": "valid",
        "certifications": 5
      },
      "currentLocation": "Planta Norte",
      "assignedProjects": ["PROJ_001", "PROJ_003"]
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 8. CONTRATISTA_SUBALTERNOS - Contractor Worker

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "assignedTasks": 12,
  "completedTasks": 45,
  "activeCourses": 3,
  "complianceScore": 85,
  "currentProject": {
    "id": "proj_001",
    "name": "Mantenimiento Planta Sur",
    "supervisor": "Ing. Roberto Silva"
  },
  "monthlyStats": {
    "hoursWorked": 160,
    "tasksCompleted": 45,
    "safetyIncidents": 0
  }
}
```

**Endpoint:** `GET /api/dashboard/tasks`
```json
{
  "tasks": [
    {
      "id": "task_001",
      "title": "Revisión de tablero eléctrico B-12",
      "projectId": "proj_001",
      "projectName": "Mantenimiento Planta Sur",
      "assignedBy": "Carlos Méndez",
      "assignedDate": "2024-01-19T14:00:00Z",
      "dueDate": "2024-01-21T17:00:00Z",
      "priority": "high",
      "status": "in_progress",
      "location": "Planta Sur - Sector B",
      "requirements": [
        "EPP completo",
        "Multímetro",
        "Permiso de trabajo"
      ],
      "safety": {
        "riskLevel": "medium",
        "requiredPPE": ["Casco", "Guantes dieléctricos", "Botas de seguridad"],
        "procedures": ["LOTO", "Trabajo eléctrico"]
      }
    }
  ],
  "training": [
    {
      "id": "training_001",
      "courseName": "Trabajo Seguro en Alturas",
      "progress": 60,
      "nextSession": "2024-01-22T09:00:00Z",
      "instructor": "Ing. Ana Martínez",
      "mandatory": true
    }
  ]
}
```

### 9. CONTRATISTA_HUERFANO - Independent Contractor

**Endpoint:** `GET /api/dashboard/stats`
```json
{
  "activeProjects": 3,
  "completedProjects": 28,
  "certifications": 12,
  "monthlyEarnings": 8500,
  "complianceScore": 90,
  "clientRating": 4.8,
  "projectStats": {
    "onTime": 25,
    "delayed": 2,
    "cancelled": 1
  },
  "upcomingRenewals": {
    "insurance": "2024-03-15",
    "certifications": 2,
    "licenses": 1
  }
}
```

**Endpoint:** `GET /api/dashboard/projects`
```json
{
  "projects": [
    {
      "id": "proj_ind_001",
      "clientName": "Espacios de Trabajo XYZ",
      "projectName": "Instalación Sistema HVAC",
      "status": "active",
      "progress": 65,
      "startDate": "2024-01-10",
      "endDate": "2024-02-10",
      "value": 12000,
      "location": "Torre Corporativa Norte",
      "requirements": {
        "insurance": "approved",
        "permits": "approved",
        "access": "granted"
      },
      "milestones": [
        {
          "name": "Instalación de ductos",
          "status": "completed",
          "completedDate": "2024-01-18"
        },
        {
          "name": "Conexión eléctrica",
          "status": "in_progress",
          "dueDate": "2024-01-25"
        }
      ],
      "invoices": {
        "total": 3,
        "paid": 1,
        "pending": 2
      }
    }
  ],
  "certifications": [
    {
      "id": "cert_001",
      "name": "Técnico HVAC Certificado",
      "issuer": "Instituto Nacional",
      "issueDate": "2023-06-15",
      "expiryDate": "2024-06-15",
      "status": "valid",
      "renewalRequired": true
    }
  ]
}
```

## Common Response Structures

### Pagination
```json
{
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
```

### Error Response
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No tienes permisos para acceder a este recurso",
    "details": {}
  }
}
```

### Success Response
```json
{
  "success": true,
  "message": "Operación completada exitosamente",
  "data": {}
}
```

## Authentication Headers
All requests must include:
```
Authorization: Bearer <jwt_token>
X-Company-ID: <company_id> (when applicable)
X-User-Role: <user_role>
```

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per company
- Real-time endpoints (activities, alerts): 10 requests per minute

## WebSocket Events (Real-time updates)
```javascript
// Connection
ws://api.safety-app.com/dashboard/realtime

// Events
{
  "event": "alert.new",
  "data": { /* alert object */ }
}

{
  "event": "activity.new",
  "data": { /* activity object */ }
}

{
  "event": "stats.update",
  "data": { /* updated stats */ }
}
```