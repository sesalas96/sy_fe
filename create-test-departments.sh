#!/bin/bash

# Token de autorización (actualizar según sea necesario)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFhNmY4YjlkOGNjMThhMGI4OTE0NDUiLCJlbWFpbCI6ImFkbWluQHNhZmV0eS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJjb21wYW55IjpudWxsLCJpYXQiOjE3NTYwMDAxNjgsImV4cCI6MTc1NjA4NjU2OH0.GDikQDS-MNBTNIMVxCf2_CRrZCXb3CqA_iEKY-lJ2IE"

# ID de empresa (actualizar con el ID de la empresa que quieras usar)
COMPANY_ID="68aa6f8a9d8cc18a0b891189"

echo "🏢 Creando departamentos para la empresa $COMPANY_ID"

echo "1️⃣ Creando departamento de Seguridad (Safety)..."
curl -X POST 'https://sybe-production.up.railway.app/api/departments' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "name": "Departamento de Seguridad",
    "code": "SAFETY",
    "description": "Departamento responsable de las aprobaciones de seguridad y cumplimiento",
    "companyId": "'$COMPANY_ID'",
    "approvalAuthority": true,
    "requiredRole": "safety_staff",
    "approvalOrder": 1
  }' | python3 -m json.tool

echo -e "\n2️⃣ Creando departamento HSE..."
curl -X POST 'https://sybe-production.up.railway.app/api/departments' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "name": "Departamento HSE", 
    "code": "HSE",
    "description": "Departamento de Salud, Seguridad y Medio Ambiente",
    "companyId": "'$COMPANY_ID'",
    "approvalAuthority": true,
    "requiredRole": "client_approver",
    "approvalOrder": 2
  }' | python3 -m json.tool

echo -e "\n3️⃣ Creando departamento de Supervisión..."
curl -X POST 'https://sybe-production.up.railway.app/api/departments' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "name": "Departamento de Supervisión",
    "code": "SUPERVISOR", 
    "description": "Supervisión de campo y vigilancia",
    "companyId": "'$COMPANY_ID'",
    "approvalAuthority": true,
    "requiredRole": "client_supervisor",
    "approvalOrder": 3
  }' | python3 -m json.tool

echo -e "\n4️⃣ Creando departamento de Recursos Humanos (sin autoridad de aprobación)..."
curl -X POST 'https://sybe-production.up.railway.app/api/departments' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "name": "Departamento de Recursos Humanos",
    "code": "HR",
    "description": "Departamento de recursos humanos",
    "companyId": "'$COMPANY_ID'",
    "approvalAuthority": false
  }' | python3 -m json.tool

echo -e "\n✅ Verificando departamentos creados..."
curl "https://sybe-production.up.railway.app/api/departments?companyId=$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n🎯 Verificando departamentos con autoridad de aprobación..."
curl "https://sybe-production.up.railway.app/api/departments/approval/$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n✨ ¡Departamentos creados exitosamente!"
echo "Ahora puedes ir a http://localhost:3001/companies/$COMPANY_ID para ver los departamentos en la interfaz."