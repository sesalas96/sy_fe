/**
 * Script para poblar la base de datos con datos de ejemplo
 * Para ejecutar: node scripts/seed-database.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Configuración de la base de datos
const MONGODB_URI = process.env.MONGO_URI;

// Esquemas simplificados (ajustar según tu modelo real)
const CompanySchema = new mongoose.Schema({
  name: String,
  ruc: String,
  address: String,
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true },
  settings: {
    notificationDays: [Number],
    requiredCourses: [String]
  }
});

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: { type: Boolean, default: true },
  profile: {
    phone: String,
    certifications: [String],
    lastLogin: Date
  }
});

const ContractorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dni: String,
  email: String,
  phone: String,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'] },
  certifications: [{
    name: String,
    issuedDate: Date,
    expiryDate: Date,
    status: String
  }],
  courses: [{
    courseId: String,
    courseName: String,
    completedDate: Date,
    score: Number,
    status: String
  }]
});

const WorkPermitSchema = new mongoose.Schema({
  permitNumber: String,
  title: String,
  description: String,
  type: String,
  status: { type: String, enum: ['pending', 'approved', 'in_progress', 'completed', 'cancelled'] },
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  startDate: Date,
  endDate: Date,
  location: String,
  riskLevel: String,
  approvals: [{
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: String,
    comments: String,
    date: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ActivitySchema = new mongoose.Schema({
  type: String,
  description: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

const AlertSchema = new mongoose.Schema({
  type: { type: String, enum: ['warning', 'error', 'info', 'success'] },
  title: String,
  message: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  actionRequired: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// Modelos
const Company = mongoose.model('Company', CompanySchema);
const User = mongoose.model('User', UserSchema);
const Contractor = mongoose.model('Contractor', ContractorSchema);
const WorkPermit = mongoose.model('WorkPermit', WorkPermitSchema);
const Activity = mongoose.model('Activity', ActivitySchema);
const Alert = mongoose.model('Alert', AlertSchema);

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. Crear empresas
    console.log('📊 Creando empresas...');
    const companies = await Company.create([
      {
        name: 'Constructora Alpha S.A.',
        ruc: '20123456789',
        address: 'Av. Javier Prado 1234, San Isidro, Lima',
        phone: '+51-1-234-5678',
        email: 'contacto@alpha.com.pe',
        settings: {
          notificationDays: [7, 15, 30],
          requiredCourses: ['seguridad-basica', 'alturas', 'espacios-confinados']
        }
      },
      {
        name: 'Minera Beta Corp',
        ruc: '20987654321',
        address: 'Av. El Derby 254, Surco, Lima',
        phone: '+51-1-987-6543',
        email: 'info@betacorp.com.pe',
        settings: {
          notificationDays: [5, 10, 20],
          requiredCourses: ['mineria-segura', 'uso-epp', 'primeros-auxilios']
        }
      },
      {
        name: 'Servicios Gamma Ltda.',
        ruc: '20456789123',
        address: 'Jr. Las Flores 789, Miraflores, Lima',
        phone: '+51-1-456-7890',
        email: 'servicios@gamma.com.pe',
        settings: {
          notificationDays: [3, 7, 14],
          requiredCourses: ['mantenimiento-seguro', 'trabajo-alturas']
        }
      }
    ]);

    // 2. Crear usuarios con diferentes roles (los 9 roles del sistema)
    console.log('👥 Creando usuarios con todos los roles...');
    const hashedPassword = await bcrypt.hash('test', 10);
    
    const users = await User.create([
      // 1. Administrador
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'admin@safety.com',
        password: hashedPassword,
        role: 'super_admin',
        profile: {
          phone: '+51-999-111-222',
          certifications: ['ISO-45001', 'OHSAS-18001', 'Auditor-Líder'],
          lastLogin: new Date()
        }
      },
      // 2. Safety Staff
      {
        firstName: 'María',
        lastName: 'González',
        email: 'safety@alpha.com.pe',
        password: hashedPassword,
        role: 'safety_staff',
        company: companies[0]._id,
        profile: {
          phone: '+51-999-222-333',
          certifications: ['Ing-Seguridad', 'Auditor-SST', 'Prevención-Riesgos'],
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
        }
      },
      // 3. Client Supervisor
      {
        firstName: 'Roberto',
        lastName: 'Silva',
        email: 'supervisor@alpha.com.pe',
        password: hashedPassword,
        role: 'client_supervisor',
        company: companies[0]._id,
        profile: {
          phone: '+51-999-333-444',
          certifications: ['Supervisor-SST', 'Gestión-Equipos'],
          lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
        }
      },
      // 4. Client Approver
      {
        firstName: 'Ana',
        lastName: 'Torres',
        email: 'approver@beta.com.pe',
        password: hashedPassword,
        role: 'client_approver',
        company: companies[1]._id,
        profile: {
          phone: '+51-999-444-555',
          certifications: ['Jefe-SST', 'Aprobador-Permisos'],
          lastLogin: new Date(Date.now() - 30 * 60 * 1000) // 30 min atrás
        }
      },
      // 5. Client Staff
      {
        firstName: 'Luis',
        lastName: 'Mendoza',
        email: 'staff@alpha.com.pe',
        password: hashedPassword,
        role: 'client_staff',
        company: companies[0]._id,
        profile: {
          phone: '+51-999-777-888',
          certifications: ['Personal-SST', 'Operaciones-Básicas'],
          lastLogin: new Date(Date.now() - 45 * 60 * 1000) // 45 min atrás
        }
      },
      // 6. Validadores Ops
      {
        firstName: 'Sandra',
        lastName: 'López',
        email: 'validator@safety.com',
        password: hashedPassword,
        role: 'validadores_ops',
        profile: {
          phone: '+51-999-666-777',
          certifications: ['Validador-SST', 'Inspector-Operaciones'],
          lastLogin: new Date(Date.now() - 5 * 60 * 1000) // 5 min atrás
        }
      },
      // 7. Contratista Admin
      {
        firstName: 'Diego',
        lastName: 'Morales',
        email: 'admin@gamma.com.pe',
        password: hashedPassword,
        role: 'contratista_admin',
        company: companies[2]._id,
        profile: {
          phone: '+51-999-555-666',
          certifications: ['Admin-Contratista', 'Gestión-Proyectos'],
          lastLogin: new Date(Date.now() - 15 * 60 * 1000) // 15 min atrás
        }
      },
      // 8. Contratista Subalternos
      {
        firstName: 'Jorge',
        lastName: 'Ramírez',
        email: 'subalternos@gamma.com.pe',
        password: hashedPassword,
        role: 'contratista_subalternos',
        company: companies[2]._id,
        profile: {
          phone: '+51-999-888-999',
          certifications: ['Técnico-Especialista', 'Supervisor-Campo'],
          lastLogin: new Date(Date.now() - 20 * 60 * 1000) // 20 min atrás
        }
      },
      // 9. Contratista Particular
      {
        firstName: 'Elena',
        lastName: 'Vargas',
        email: 'huerfano@freelance.com',
        password: hashedPassword,
        role: 'contratista_huerfano',
        company: null, // Sin empresa asignada
        profile: {
          phone: '+51-999-000-111',
          certifications: ['Contratista-Independiente', 'Multi-Especialidad'],
          lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 día atrás
        }
      }
    ]);

    // 3. Crear contratistas
    console.log('👷 Creando contratistas...');
    const contractors = await Contractor.create([
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        email: 'juan.perez@email.com',
        phone: '+51-987-123-456',
        company: companies[0]._id,
        supervisor: users[2]._id, // Roberto Silva (client_supervisor)
        status: 'active',
        certifications: [
          {
            name: 'Trabajo en Alturas',
            issuedDate: new Date('2024-01-15'),
            expiryDate: new Date('2025-01-15'),
            status: 'valid'
          },
          {
            name: 'Espacios Confinados',
            issuedDate: new Date('2023-06-01'),
            expiryDate: new Date('2024-06-01'),
            status: 'expired'
          }
        ],
        courses: [
          {
            courseId: 'seg-001',
            courseName: 'Seguridad Básica',
            completedDate: new Date('2024-01-10'),
            score: 95,
            status: 'completed'
          }
        ]
      },
      {
        firstName: 'Patricia',
        lastName: 'Vega',
        dni: '87654321',
        email: 'patricia.vega@email.com',
        phone: '+51-987-654-321',
        company: companies[1]._id,
        supervisor: users[3]._id, // Ana Torres (client_approver)
        status: 'active',
        certifications: [
          {
            name: 'Operación de Equipos',
            issuedDate: new Date('2024-02-01'),
            expiryDate: new Date('2025-02-01'),
            status: 'valid'
          }
        ],
        courses: [
          {
            courseId: 'min-001',
            courseName: 'Minería Segura',
            completedDate: new Date('2024-01-20'),
            score: 88,
            status: 'completed'
          }
        ]
      },
      {
        firstName: 'Miguel',
        lastName: 'Castillo',
        dni: '11223344',
        email: 'miguel.castillo@email.com',
        phone: '+51-987-112-233',
        company: companies[2]._id,
        supervisor: users[6]._id, // Diego Morales (contratista_admin)
        status: 'active',
        certifications: [
          {
            name: 'Mantenimiento Eléctrico',
            issuedDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            status: 'valid'
          }
        ],
        courses: [
          {
            courseId: 'man-001',
            courseName: 'Mantenimiento Seguro',
            completedDate: new Date('2024-01-05'),
            score: 92,
            status: 'completed'
          }
        ]
      },
      {
        firstName: 'Carmen',
        lastName: 'Ruiz',
        dni: '44556677',
        email: 'carmen.ruiz@email.com',
        phone: '+51-987-445-566',
        company: companies[0]._id,
        supervisor: users[2]._id,
        status: 'inactive',
        certifications: [
          {
            name: 'Soldadura',
            issuedDate: new Date('2023-12-01'),
            expiryDate: new Date('2024-12-01'),
            status: 'expiring_soon'
          }
        ],
        courses: []
      }
    ]);

    // 4. Crear permisos de trabajo
    console.log('📋 Creando permisos de trabajo...');
    const workPermits = await WorkPermit.create([
      {
        permitNumber: 'PT-2024-001',
        title: 'Mantenimiento Sistema Eléctrico',
        description: 'Mantenimiento preventivo del sistema eléctrico en el edificio A',
        type: 'electrical',
        status: 'in_progress',
        priority: 'high',
        requestedBy: users[2]._id,
        assignedTo: contractors[2]._id,
        company: companies[0]._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
        location: 'Edificio A - Piso 3',
        riskLevel: 'medium',
        approvals: [
          {
            approver: users[1]._id,
            status: 'approved',
            comments: 'Revisar protocolos de seguridad',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        permitNumber: 'PT-2024-002',
        title: 'Soldadura Estructura Metálica',
        description: 'Reparación de estructura metálica en zona de carga',
        type: 'welding',
        status: 'approved',
        priority: 'medium',
        requestedBy: users[2]._id,
        assignedTo: contractors[0]._id,
        company: companies[0]._id,
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // mañana
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
        location: 'Zona de Carga - Exterior',
        riskLevel: 'high',
        approvals: [
          {
            approver: users[1]._id,
            status: 'approved',
            comments: 'Usar EPP completo y ventilación adecuada',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        ]
      },
      {
        permitNumber: 'PT-2024-003',
        title: 'Inspección de Equipos',
        description: 'Inspección mensual de equipos de seguridad',
        type: 'inspection',
        status: 'pending',
        priority: 'low',
        requestedBy: users[3]._id,
        assignedTo: contractors[1]._id,
        company: companies[1]._id,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        location: 'Almacén Principal',
        riskLevel: 'low',
        approvals: []
      },
      {
        permitNumber: 'PT-2024-004',
        title: 'Limpieza Tanques',
        description: 'Limpieza y mantenimiento de tanques de almacenamiento',
        type: 'confined_space',
        status: 'cancelled',
        priority: 'high',
        requestedBy: users[4]._id,
        assignedTo: contractors[2]._id,
        company: companies[2]._id,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        location: 'Área de Tanques',
        riskLevel: 'high',
        approvals: [
          {
            approver: users[1]._id,
            status: 'rejected',
            comments: 'Falta certificación de espacios confinados',
            date: new Date(Date.now() - 12 * 60 * 60 * 1000)
          }
        ]
      }
    ]);

    // 5. Crear actividades
    console.log('📊 Creando actividades...');
    const activities = await Activity.create([
      {
        type: 'permit_created',
        description: 'Nuevo permiso de trabajo creado para mantenimiento eléctrico',
        user: users[2]._id,
        company: companies[0]._id,
        metadata: { permitId: workPermits[0]._id, permitNumber: 'PT-2024-001' },
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        type: 'permit_approved',
        description: 'Permiso de soldadura aprobado por Safety Staff',
        user: users[1]._id,
        company: companies[0]._id,
        metadata: { permitId: workPermits[1]._id, permitNumber: 'PT-2024-002' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        type: 'training_completed',
        description: 'Juan Pérez completó entrenamiento de Seguridad Básica',
        user: users[2]._id,
        company: companies[0]._id,
        metadata: { contractorId: contractors[0]._id, courseId: 'seg-001', score: 95 },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        type: 'certification_expired',
        description: 'Certificación de Juan Pérez en Espacios Confinados ha expirado',
        user: users[1]._id,
        company: companies[0]._id,
        metadata: { contractorId: contractors[0]._id, certification: 'Espacios Confinados' },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        type: 'user_login',
        description: 'Sandra López inició sesión en el sistema',
        user: users[5]._id,
        company: null,
        metadata: { loginTime: new Date(Date.now() - 5 * 60 * 1000) },
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        type: 'permit_cancelled',
        description: 'Permiso de limpieza de tanques cancelado por falta de certificaciones',
        user: users[4]._id,
        company: companies[2]._id,
        metadata: { permitId: workPermits[3]._id, reason: 'missing_certification' },
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        type: 'contractor_registered',
        description: 'Nuevo contratista registrado: Miguel Castillo',
        user: users[4]._id,
        company: companies[2]._id,
        metadata: { contractorId: contractors[2]._id },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'inspection_scheduled',
        description: 'Inspección de equipos programada para la próxima semana',
        user: users[3]._id,
        company: companies[1]._id,
        metadata: { permitId: workPermits[2]._id, scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'staff_task_assigned',
        description: 'Luis Mendoza recibió nueva tarea de revisión de documentos',
        user: users[4]._id, // Luis Mendoza (client_staff)
        company: companies[0]._id,
        metadata: { taskType: 'document_review', priority: 'medium' },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        type: 'subalterno_report',
        description: 'Jorge Ramírez envió reporte de progreso del equipo',
        user: users[7]._id, // Jorge Ramírez (contratista_subalternos)
        company: companies[2]._id,
        metadata: { reportType: 'weekly_progress', teamSize: 5 },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      {
        type: 'huerfano_application',
        description: 'Elena Vargas aplicó para nuevo proyecto independiente',
        user: users[8]._id, // Elena Vargas (contratista_huerfano)
        company: null,
        metadata: { projectType: 'maintenance', duration: '2_weeks' },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]);

    // 6. Crear alertas
    console.log('🚨 Creando alertas...');
    const alerts = await Alert.create([
      {
        type: 'warning',
        title: 'Certificación próxima a vencer',
        message: 'La certificación de Carmen Ruiz en Soldadura vence en 5 días',
        user: users[2]._id,
        company: companies[0]._id,
        isRead: false,
        priority: 'high',
        actionRequired: true,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        type: 'error',
        title: 'Certificación expirada',
        message: 'Juan Pérez tiene una certificación expirada en Espacios Confinados',
        user: users[2]._id,
        company: companies[0]._id,
        isRead: false,
        priority: 'high',
        actionRequired: true,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        type: 'warning',
        title: 'Permiso próximo a vencer',
        message: 'El permiso PT-2024-001 vence mañana y aún está en progreso',
        user: users[1]._id,
        company: companies[0]._id,
        isRead: false,
        priority: 'medium',
        actionRequired: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        type: 'info',
        title: 'Nuevo contratista registrado',
        message: 'Miguel Castillo se ha registrado como nuevo contratista',
        user: users[4]._id,
        company: companies[2]._id,
        isRead: true,
        priority: 'low',
        actionRequired: false,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'success',
        title: 'Entrenamiento completado',
        message: 'Juan Pérez completó exitosamente el curso de Seguridad Básica con 95%',
        user: users[2]._id,
        company: companies[0]._id,
        isRead: true,
        priority: 'low',
        actionRequired: false,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        type: 'error',
        title: 'Permiso rechazado',
        message: 'El permiso PT-2024-004 fue rechazado por falta de certificaciones',
        user: users[4]._id,
        company: companies[2]._id,
        isRead: false,
        priority: 'high',
        actionRequired: true,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        type: 'warning',
        title: 'Equipo requiere mantenimiento',
        message: 'El equipo de seguridad #EQ-001 requiere mantenimiento programado',
        user: users[3]._id,
        company: companies[1]._id,
        isRead: false,
        priority: 'medium',
        actionRequired: true,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'info',
        title: 'Inspección programada',
        message: 'Inspección mensual de equipos programada para el próximo lunes',
        user: users[3]._id,
        company: companies[1]._id,
        isRead: true,
        priority: 'low',
        actionRequired: false,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'info',
        title: 'Tarea asignada a staff',
        message: 'Luis Mendoza tiene nuevas tareas de revisión pendientes',
        user: users[4]._id, // Luis Mendoza (client_staff)
        company: companies[0]._id,
        isRead: false,
        priority: 'medium',
        actionRequired: true,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        type: 'success',
        title: 'Reporte enviado',
        message: 'Jorge Ramírez completó el reporte semanal del equipo de subalternos',
        user: users[7]._id, // Jorge Ramírez (contratista_subalternos)
        company: companies[2]._id,
        isRead: true,
        priority: 'low',
        actionRequired: false,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      {
        type: 'warning',
        title: 'Contratista Particular requiere validación',
        message: 'Elena Vargas necesita validación de documentos para nuevo proyecto',
        user: users[5]._id, // Sandra López (validadores_ops)
        company: null,
        isRead: false,
        priority: 'high',
        actionRequired: true,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]);

    console.log('✅ Seed completado exitosamente!');
    console.log(`📊 Datos creados:`);
    console.log(`   - ${companies.length} empresas`);
    console.log(`   - ${users.length} usuarios (9 roles)`);
    console.log(`   - ${contractors.length} contratistas`);
    console.log(`   - ${workPermits.length} permisos de trabajo`);
    console.log(`   - ${activities.length} actividades`);
    console.log(`   - ${alerts.length} alertas`);

    console.log('\n🔑 Usuarios de prueba creados (TODOS LOS 9 ROLES):');
    console.log('   admin@safety.com (super_admin) - test');
    console.log('   safety@alpha.com.pe (safety_staff) - test');
    console.log('   supervisor@alpha.com.pe (client_supervisor) - test');
    console.log('   approver@beta.com.pe (client_approver) - test');
    console.log('   staff@alpha.com.pe (client_staff) - test');
    console.log('   validator@safety.com (validadores_ops) - test');
    console.log('   admin@gamma.com.pe (contratista_admin) - test');
    console.log('   subalternos@gamma.com.pe (contratista_subalternos) - test');
    console.log('   huerfano@freelance.com (contratista_huerfano) - test');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el seed
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };