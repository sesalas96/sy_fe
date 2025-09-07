const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/safety_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Esquemas para los seeds
const ServiceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' },
  requiredCertifications: [String],
  requiredPPE: [String],
  defaultTools: [String],
  order: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
  billingUnit: { type: String, required: true },
  estimatedDuration: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  sla: {
    responseTime: { type: Number, default: 4 },
    resolutionTime: { type: Number, default: 8 }
  },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  tags: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const WorkRequestSchema = new mongoose.Schema({
  workRequestNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['draft', 'published', 'bidding', 'awarded', 'completed', 'cancelled'], default: 'draft' },
  requestedStartDate: { type: Date, required: true },
  requestedEndDate: { type: Date, required: true },
  location: { type: String, required: true },
  coordinates: {
    lat: Number,
    lng: Number
  },
  budget: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  requirements: [String],
  attachments: [String],
  publishedAt: Date,
  biddingDeadline: Date,
  awardedBidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }
}, { timestamps: true });

const BidSchema = new mongoose.Schema({
  bidNumber: { type: String, required: true, unique: true },
  workRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkRequest', required: true },
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractorCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  proposedStartDate: { type: Date, required: true },
  proposedEndDate: { type: Date, required: true },
  laborCost: { type: Number, required: true },
  materialsCost: { type: Number, required: true },
  equipmentCost: { type: Number, default: 0 },
  otherCosts: { type: Number, default: 0 },
  notes: String,
  status: { type: String, enum: ['submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'], default: 'submitted' },
  validUntil: { type: Date, required: true },
  milestones: [{
    name: String,
    description: String,
    plannedDate: Date,
    estimatedHours: Number,
    percentage: Number
  }],
  attachments: [String]
}, { timestamps: true });

// Modelos
const ServiceCategory = mongoose.model('ServiceCategory', ServiceCategorySchema);
const Service = mongoose.model('Service', ServiceSchema);
const WorkRequest = mongoose.model('WorkRequest', WorkRequestSchema);
const Bid = mongoose.model('Bid', BidSchema);

// Función para generar número secuencial
function generateSequentialNumber(prefix, counter) {
  return `${prefix}-${String(counter).padStart(4, '0')}`;
}

async function seedCompleteMarketplace() {
  try {
    console.log('🌱 Starting complete marketplace seed...');

    // Limpiar colecciones
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    await WorkRequest.deleteMany({});
    await Bid.deleteMany({});
    console.log('✅ Cleared existing data');

    // ===============================
    // 🏷️ CATEGORÍAS Y SERVICIOS
    // ===============================

    // Crear categorías principales
    const electricidadCategory = await ServiceCategory.create({
      name: 'Electricidad',
      code: 'ELEC',
      description: 'Servicios eléctricos y mantenimiento de sistemas eléctricos',
      requiredCertifications: ['Electricista Certificado', 'NEC Compliance'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes dieléctricos'],
      order: 1
    });

    const plomeriaCategory = await ServiceCategory.create({
      name: 'Plomería',
      code: 'PLOM',
      description: 'Servicios de plomería e instalaciones hidráulicas',
      requiredCertifications: ['Plomero Certificado'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes'],
      order: 2
    });

    const hvacCategory = await ServiceCategory.create({
      name: 'HVAC',
      code: 'HVAC',
      description: 'Calefacción, Ventilación y Aire Acondicionado',
      requiredCertifications: ['Técnico HVAC', 'EPA 608'],
      requiredPPE: ['Casco', 'Gafas', 'Respirador'],
      order: 3
    });

    const mantenimientoCategory = await ServiceCategory.create({
      name: 'Mantenimiento General',
      code: 'MANT',
      description: 'Servicios de mantenimiento preventivo y correctivo',
      requiredCertifications: ['Técnico en Mantenimiento'],
      requiredPPE: ['Casco', 'Gafas', 'Guantes'],
      order: 4
    });

    const limpiezaCategory = await ServiceCategory.create({
      name: 'Limpieza',
      code: 'LIMP',
      description: 'Servicios de limpieza y sanitización',
      requiredCertifications: ['Manejo de Químicos'],
      requiredPPE: ['Guantes', 'Mascarilla', 'Delantal'],
      order: 5
    });

    // Crear servicios variados
    const services = await Service.create([
      // Electricidad
      {
        name: 'Instalación de Tomacorrientes 110V',
        code: 'ELEC-TOMA-110',
        description: 'Instalación de tomacorrientes estándar 110V con conexión a tierra',
        category: electricidadCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 2,
        basePrice: 45.00,
        sla: { responseTime: 4, resolutionTime: 8 },
        riskLevel: 'medium',
        tags: ['electricidad', 'instalacion', 'tomacorrientes']
      },
      {
        name: 'Instalación de Tomacorrientes 220V',
        code: 'ELEC-TOMA-220',
        description: 'Instalación de tomacorrientes industriales 220V para equipos especiales',
        category: electricidadCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 3,
        basePrice: 75.00,
        sla: { responseTime: 4, resolutionTime: 12 },
        riskLevel: 'high',
        tags: ['electricidad', 'instalacion', 'tomacorrientes', 'industrial']
      },
      {
        name: 'Mantenimiento de Tableros Eléctricos',
        code: 'ELEC-TABL-MANT',
        description: 'Revisión, limpieza y mantenimiento preventivo de tableros eléctricos',
        category: electricidadCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 4,
        basePrice: 120.00,
        sla: { responseTime: 2, resolutionTime: 8 },
        riskLevel: 'high',
        tags: ['electricidad', 'mantenimiento', 'tableros']
      },

      // Plomería
      {
        name: 'Reparación de Fugas en Tuberías',
        code: 'PLOM-FUGA-REP',
        description: 'Localización y reparación de fugas en sistemas de tuberías',
        category: plomeriaCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 3,
        basePrice: 65.00,
        sla: { responseTime: 2, resolutionTime: 6 },
        riskLevel: 'medium',
        tags: ['plomeria', 'reparacion', 'fugas']
      },
      {
        name: 'Instalación de Lavamanos',
        code: 'PLOM-LAVA-INST',
        description: 'Instalación completa de lavamanos incluyendo grifería',
        category: plomeriaCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 4,
        basePrice: 95.00,
        sla: { responseTime: 8, resolutionTime: 16 },
        riskLevel: 'medium',
        tags: ['plomeria', 'instalacion', 'lavamanos']
      },

      // HVAC
      {
        name: 'Mantenimiento de Aires Acondicionados',
        code: 'HVAC-AC-MANT',
        description: 'Mantenimiento preventivo completo de unidades de A/C',
        category: hvacCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 2,
        basePrice: 85.00,
        sla: { responseTime: 4, resolutionTime: 8 },
        riskLevel: 'medium',
        tags: ['hvac', 'mantenimiento', 'aire_acondicionado']
      },
      {
        name: 'Instalación de Ventiladores de Techo',
        code: 'HVAC-VENT-INST',
        description: 'Instalación de ventiladores de techo industriales y residenciales',
        category: hvacCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 3,
        basePrice: 110.00,
        sla: { responseTime: 8, resolutionTime: 12 },
        riskLevel: 'medium',
        tags: ['hvac', 'instalacion', 'ventiladores']
      },

      // Mantenimiento
      {
        name: 'Pintura de Paredes Interiores',
        code: 'MANT-PINT-INT',
        description: 'Servicio profesional de pintura para paredes interiores',
        category: mantenimientoCategory._id,
        billingUnit: 'metro cuadrado',
        estimatedDuration: 8,
        basePrice: 8.50,
        sla: { responseTime: 12, resolutionTime: 48 },
        riskLevel: 'low',
        tags: ['mantenimiento', 'pintura', 'interior']
      },
      {
        name: 'Reparación de Puertas y Ventanas',
        code: 'MANT-PUER-REP',
        description: 'Reparación y ajuste de puertas y ventanas',
        category: mantenimientoCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 2,
        basePrice: 55.00,
        sla: { responseTime: 8, resolutionTime: 16 },
        riskLevel: 'low',
        tags: ['mantenimiento', 'puertas', 'ventanas']
      },

      // Limpieza
      {
        name: 'Limpieza Profunda de Oficinas',
        code: 'LIMP-OFIC-PROF',
        description: 'Servicio de limpieza profunda para espacios comerciales',
        category: limpiezaCategory._id,
        billingUnit: 'metro cuadrado',
        estimatedDuration: 6,
        basePrice: 4.25,
        sla: { responseTime: 12, resolutionTime: 24 },
        riskLevel: 'low',
        tags: ['limpieza', 'oficinas', 'comercial']
      }
    ]);

    console.log('✅ Categories and Services created');

    // ===============================
    // 📋 WORK REQUESTS DE EJEMPLO
    // ===============================

    // Obtener algunos usuarios y empresas existentes (asumiendo que ya existen)
    // En un entorno real, deberías tener usuarios y empresas ya creados
    const sampleClientId = new mongoose.Types.ObjectId();
    const sampleCompanyId = new mongoose.Types.ObjectId();
    const sampleContractorId = new mongoose.Types.ObjectId();
    const sampleContractorCompanyId = new mongoose.Types.ObjectId();

    const workRequests = [];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['draft', 'published', 'bidding', 'awarded', 'completed'];
    const locations = [
      'Edificio Torre Mercedes, Rohrmoser, San José',
      'Centro Comercial Multiplaza, Escazú',
      'Oficinas Corporativas, Santa Ana',
      'Complejo Industrial, Cartago',
      'Hospital Nacional, San José Centro',
      'Universidad Técnica, Curridabat',
      'Centro de Convenciones, Belén',
      'Parque Industrial, Heredia'
    ];

    // Crear 15 work requests variados
    for (let i = 1; i <= 15; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      const startDate = faker.date.between({ 
        from: new Date(), 
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      });
      const endDate = new Date(startDate.getTime() + (service.estimatedDuration * 24 * 60 * 60 * 1000));
      
      const workRequest = await WorkRequest.create({
        workRequestNumber: generateSequentialNumber('WR', 2024000 + i),
        title: `${service.name} - ${location.split(',')[0]}`,
        description: `Se requiere ${service.description.toLowerCase()} en las instalaciones de ${location}. ${faker.lorem.sentence()}`,
        serviceId: service._id,
        clientId: sampleClientId,
        clientCompanyId: sampleCompanyId,
        priority: priority,
        status: status,
        requestedStartDate: startDate,
        requestedEndDate: endDate,
        location: location,
        coordinates: {
          lat: 9.9281 + (Math.random() - 0.5) * 0.1, // San José area
          lng: -84.0907 + (Math.random() - 0.5) * 0.1
        },
        budget: service.basePrice * (1 + Math.random() * 0.5), // +0% to +50%
        currency: 'USD',
        requirements: [
          'Certificaciones requeridas según normativa',
          'Equipo de seguridad completo',
          'Materiales de primera calidad',
          'Garantía mínima de 6 meses'
        ].slice(0, Math.floor(Math.random() * 4) + 1),
        publishedAt: status !== 'draft' ? faker.date.past({ days: 10 }) : null,
        biddingDeadline: status === 'published' || status === 'bidding' ? 
          faker.date.future({ days: 7 }) : null
      });

      workRequests.push(workRequest);

      // Crear algunas ofertas para requests publicados
      if (['published', 'bidding', 'awarded'].includes(status)) {
        const numBids = Math.floor(Math.random() * 4) + 1; // 1-4 ofertas
        
        for (let j = 1; j <= numBids; j++) {
          const proposedStart = faker.date.between({ 
            from: workRequest.requestedStartDate, 
            to: new Date(workRequest.requestedStartDate.getTime() + 7 * 24 * 60 * 60 * 1000) 
          });
          const proposedEnd = new Date(proposedStart.getTime() + (service.estimatedDuration * 24 * 60 * 60 * 1000));
          
          const laborCost = service.basePrice * 0.6 * (0.8 + Math.random() * 0.4); // ±20%
          const materialsCost = service.basePrice * 0.3 * (0.8 + Math.random() * 0.4);
          const equipmentCost = service.basePrice * 0.1 * (0.8 + Math.random() * 0.4);
          const totalPrice = laborCost + materialsCost + equipmentCost;
          
          const bidStatus = status === 'awarded' && j === 1 ? 'accepted' : 
                          Math.random() < 0.8 ? 'submitted' : 'under_review';
          
          await Bid.create({
            bidNumber: generateSequentialNumber('BID', 2024000 + ((i-1) * 5) + j),
            workRequestId: workRequest._id,
            contractorId: sampleContractorId,
            contractorCompanyId: sampleContractorCompanyId,
            totalPrice: totalPrice,
            currency: 'USD',
            proposedStartDate: proposedStart,
            proposedEndDate: proposedEnd,
            laborCost: laborCost,
            materialsCost: materialsCost,
            equipmentCost: equipmentCost,
            otherCosts: 0,
            notes: `Propuesta para ${service.name}. ${faker.lorem.sentence()}`,
            status: bidStatus,
            validUntil: faker.date.future({ days: 30 }),
            milestones: [
              {
                name: 'Inicio de trabajos',
                description: 'Preparación y inicio de la actividad',
                plannedDate: proposedStart,
                estimatedHours: service.estimatedDuration * 0.2,
                percentage: 20
              },
              {
                name: 'Desarrollo principal',
                description: 'Ejecución del trabajo principal',
                plannedDate: new Date(proposedStart.getTime() + (service.estimatedDuration * 0.5 * 24 * 60 * 60 * 1000)),
                estimatedHours: service.estimatedDuration * 0.6,
                percentage: 60
              },
              {
                name: 'Finalización y entrega',
                description: 'Terminación y entrega del trabajo',
                plannedDate: proposedEnd,
                estimatedHours: service.estimatedDuration * 0.2,
                percentage: 20
              }
            ]
          });
        }
      }
    }

    console.log('✅ Work Requests and Bids created');

    // ===============================
    // 📊 ESTADÍSTICAS FINALES
    // ===============================
    
    const totalCategories = await ServiceCategory.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalWorkRequests = await WorkRequest.countDocuments();
    const totalBids = await Bid.countDocuments();
    
    const stats = await Promise.all([
      WorkRequest.countDocuments({ status: 'draft' }),
      WorkRequest.countDocuments({ status: 'published' }),
      WorkRequest.countDocuments({ status: 'bidding' }),
      WorkRequest.countDocuments({ status: 'awarded' }),
      WorkRequest.countDocuments({ status: 'completed' }),
      Bid.countDocuments({ status: 'submitted' }),
      Bid.countDocuments({ status: 'accepted' }),
      Service.aggregate([{$group: {_id: null, avg: {$avg: '$basePrice'}}}])
    ]);

    console.log('\n🎉 Complete marketplace seed finished successfully!');
    console.log('\n📈 Final Statistics:');
    console.log(`   📁 Categories: ${totalCategories}`);
    console.log(`   ⚙️  Services: ${totalServices}`);
    console.log(`   📋 Work Requests: ${totalWorkRequests}`);
    console.log(`   💼 Bids: ${totalBids}`);
    console.log(`   💰 Average Service Price: $${stats[7][0]?.avg?.toFixed(2) || '0.00'}`);
    
    console.log('\n📊 Work Request Status Distribution:');
    console.log(`   📝 Draft: ${stats[0]}`);
    console.log(`   📢 Published: ${stats[1]}`);
    console.log(`   🔥 Bidding: ${stats[2]}`);
    console.log(`   🏆 Awarded: ${stats[3]}`);
    console.log(`   ✅ Completed: ${stats[4]}`);
    
    console.log('\n💼 Bid Status Distribution:');
    console.log(`   📨 Submitted: ${stats[5]}`);
    console.log(`   ✅ Accepted: ${stats[6]}`);
    
    console.log('\n🎯 Sample Data Ready for Testing:');
    console.log('   - Service catalog with realistic prices');
    console.log('   - Work requests in various states');
    console.log('   - Competitive bidding examples');
    console.log('   - Milestone planning data');
    console.log('   - Costa Rican locations and context');

  } catch (error) {
    console.error('❌ Error seeding complete marketplace:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Ejecutar el seed completo
seedCompleteMarketplace();