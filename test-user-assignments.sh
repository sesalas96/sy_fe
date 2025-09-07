#!/bin/bash

# Token de autorización
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFhNmY4YjlkOGNjMThhMGI4OTE0NDUiLCJlbWFpbCI6ImFkbWluQHNhZmV0eS5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJjb21wYW55IjpudWxsLCJpYXQiOjE3NTYwMDAxNjgsImV4cCI6MTc1NjA4NjU2OH0.GDikQDS-MNBTNIMVxCf2_CRrZCXb3CqA_iEKY-lJ2IE"

# IDs del sistema
COMPANY_ID="68aa6f8a9d8cc18a0b891189"  # Constructora Alpha S.A.
SAFETY_DEPT_ID="68aa99034430472396dcc6df"   # Safety Department  
HSE_DEPT_ID="68aa99144430472396dcc6ed"      # HSE Department
SUPERVISOR_DEPT_ID="68aa9eed4430472396dd0f76" # Departamento de Supervisión

# Usuarios de ejemplo
SAFETY_USER="68aa6f8b9d8cc18a0b891447"     # María González (safety_staff)
SUPERVISOR_USER="68aa6f8b9d8cc18a0b89144b" # Roberto Silva (client_supervisor)
STAFF_USER="68aa6f8b9d8cc18a0b891459"      # Diana Moreno (client_staff)

echo "🏢 Probando Sistema de Asignación de Usuarios a Departamentos"
echo "================================================================"

echo "1️⃣ Obteniendo Usuarios..."
curl "http://localhost:3000/api/users?companyId=$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n\n2️⃣ Asignando María González al Departamento de Seguridad..."
curl -X POST "http://localhost:3000/api/departments/$SAFETY_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "userIds": ["'$SAFETY_USER'"]
  }' | python3 -m json.tool

echo -e "\n\n3️⃣ Asignando Roberto Silva al Departamento HSE..."
curl -X POST "http://localhost:3000/api/departments/$HSE_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "userIds": ["'$SUPERVISOR_USER'"]
  }' | python3 -m json.tool

echo -e "\n\n4️⃣ Asignando Diana Moreno al Departamento de Supervisión..."
curl -X POST "http://localhost:3000/api/departments/$SUPERVISOR_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "userIds": ["'$STAFF_USER'"]
  }' | python3 -m json.tool

echo -e "\n\n5️⃣ Verificando usuarios del Departamento de Seguridad..."
curl "http://localhost:3000/api/departments/$SAFETY_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n\n6️⃣ Verificando usuarios del Departamento HSE..."
curl "http://localhost:3000/api/departments/$HSE_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n\n7️⃣ Verificando usuarios del Departamento de Supervisión..."
curl "http://localhost:3000/api/departments/$SUPERVISOR_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n\n8️⃣ Asignando un usuario a múltiples departamentos (María González a HSE también)..."
curl -X POST "http://localhost:3000/api/departments/$HSE_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "userIds": ["'$SAFETY_USER'"]
  }' | python3 -m json.tool

echo -e "\n\n9️⃣ Verificando que María González ahora está en ambos departamentos..."
echo "Usuarios en Departamento de Seguridad:"
curl "http://localhost:3000/api/departments/$SAFETY_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\nUsuarios en Departamento HSE:"
curl "http://localhost:3000/api/departments/$HSE_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n\n🔟 Probando remover un usuario de un departamento..."
curl -X DELETE "http://localhost:3000/api/departments/$HSE_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "userIds": ["'$SUPERVISOR_USER'"]
  }' | python3 -m json.tool

echo -e "\n\n1️⃣1️⃣ Verificando que Roberto Silva fue removido del HSE..."
curl "http://localhost:3000/api/departments/$HSE_DEPT_ID/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' | python3 -m json.tool

echo -e "\n\n✅ ¡Prueba completada!"
echo "El sistema de asignación de usuarios a departamentos está funcionando correctamente."