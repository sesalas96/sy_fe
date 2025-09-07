const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/safety_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Esquemas simplificados para los seeds
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
  estimatedDuration: { type: Number, required: true }, // hours
  basePrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  sla: {
    responseTime: { type: Number, default: 4 }, // hours
    resolutionTime: { type: Number, default: 8 } // hours
  },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  tags: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ServiceCategory = mongoose.model('ServiceCategory', ServiceCategorySchema);
const Service = mongoose.model('Service', ServiceSchema);

async function seedMarketplace() {
  try {
    console.log('🌱 Starting marketplace seed...');

    // Limpiar colecciones existentes
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    console.log('✅ Cleared existing data');

    // ===============================
    // 🏷️ CATEGORÍAS PRINCIPALES
    // ===============================
    
    const electricidadCategory = await ServiceCategory.create({
      name: 'Electricidad',
      code: 'ELEC',
      description: 'Servicios eléctricos y mantenimiento de sistemas eléctricos',
      parentCategory: null,
      requiredCertifications: ['Electricista Certificado', 'NEC Compliance'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes dieléctricos', 'Botas aislantes'],
      defaultTools: ['Multímetro', 'Alicates', 'Destornilladores aislados', 'Probador de voltaje'],
      order: 1
    });

    const plomeriaCategory = await ServiceCategory.create({
      name: 'Plomería',
      code: 'PLOM',
      description: 'Servicios de plomería e instalaciones hidráulicas',
      parentCategory: null,
      requiredCertifications: ['Plomero Certificado'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes de nitrilo'],
      defaultTools: ['Llave inglesa', 'Destornillador', 'Cortador de tuberías'],
      order: 2
    });

    const hvacCategory = await ServiceCategory.create({
      name: 'HVAC',
      code: 'HVAC',
      description: 'Calefacción, Ventilación y Aire Acondicionado',
      parentCategory: null,
      requiredCertifications: ['Técnico HVAC Certificado', 'EPA Section 608'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes', 'Respirador'],
      defaultTools: ['Manifold', 'Termómetro digital', 'Bomba de vacío'],
      order: 3
    });

    const mantenimientoCategory = await ServiceCategory.create({
      name: 'Mantenimiento General',
      code: 'MANT',
      description: 'Servicios de mantenimiento preventivo y correctivo',
      parentCategory: null,
      requiredCertifications: ['Técnico en Mantenimiento'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes de trabajo'],
      defaultTools: ['Caja de herramientas', 'Taladro', 'Nivel'],
      order: 4
    });

    const limpiezaCategory = await ServiceCategory.create({
      name: 'Limpieza y Sanitización',
      code: 'LIMP',
      description: 'Servicios de limpieza, desinfección y sanitización',
      parentCategory: null,
      requiredCertifications: ['Manejo de Químicos', 'Bioseguridad'],
      requiredPPE: ['Guantes de nitrilo', 'Mascarilla N95', 'Delantal impermeable'],
      defaultTools: ['Equipo de aspersión', 'Materiales de limpieza'],
      order: 5
    });

    // ===============================
    // 🔧 SUBCATEGORÍAS
    // ===============================

    const instalacionesElectricas = await ServiceCategory.create({
      name: 'Instalaciones Eléctricas',
      code: 'ELEC-INST',
      description: 'Instalación de sistemas y componentes eléctricos',
      parentCategory: electricidadCategory._id,
      requiredCertifications: ['Electricista Certificado'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes dieléctricos'],
      defaultTools: ['Taladro', 'Conduit', 'Cables'],
      order: 1
    });

    const mantenimientoElectrico = await ServiceCategory.create({
      name: 'Mantenimiento Eléctrico',
      code: 'ELEC-MANT',
      description: 'Mantenimiento preventivo y correctivo de sistemas eléctricos',
      parentCategory: electricidadCategory._id,
      requiredCertifications: ['Electricista Certificado'],
      requiredPPE: ['Casco', 'Gafas de seguridad', 'Guantes dieléctricos'],
      defaultTools: ['Multímetro', 'Megóhmetro', 'Termómetro infrarrojo'],
      order: 2
    });

    console.log('✅ Categories created');

    // ===============================
    // ⚙️ SERVICIOS
    // ===============================

    // Servicios de Electricidad
    await Service.create([
      {
        name: 'Instalación de Tomacorrientes',
        code: 'ELEC-TOMA-001',
        description: 'Instalación profesional de tomacorrientes industriales y residenciales con conexión a tierra',
        category: instalacionesElectricas._id,
        billingUnit: 'unidad',
        estimatedDuration: 2,
        basePrice: 45.00,
        currency: 'USD',
        sla: { responseTime: 4, resolutionTime: 8 },
        riskLevel: 'medium',
        tags: ['electricidad', 'instalacion', 'tomacorrientes', 'residential', 'industrial']
      },
      {
        name: 'Instalación de Interruptores',
        code: 'ELEC-INTE-001',
        description: 'Instalación de interruptores simples, dobles y conmutadores',
        category: instalacionesElectricas._id,
        billingUnit: 'unidad',
        estimatedDuration: 1.5,
        basePrice: 35.00,
        currency: 'USD',
        sla: { responseTime: 4, resolutionTime: 6 },
        riskLevel: 'medium',
        tags: ['electricidad', 'instalacion', 'interruptores']
      },
      {
        name: 'Cableado Estructurado',
        code: 'ELEC-CABL-001',
        description: 'Instalación de cableado estructurado para redes de datos y telefonía',
        category: instalacionesElectricas._id,
        billingUnit: 'metro',
        estimatedDuration: 8,
        basePrice: 12.00,
        currency: 'USD',
        sla: { responseTime: 8, resolutionTime: 24 },
        riskLevel: 'low',
        tags: ['electricidad', 'cableado', 'redes', 'telefonia']
      },
      {
        name: 'Mantenimiento de Tableros Eléctricos',
        code: 'ELEC-TABL-001',
        description: 'Inspección, limpieza y mantenimiento de tableros eléctricos principales',
        category: mantenimientoElectrico._id,
        billingUnit: 'unidad',
        estimatedDuration: 4,
        basePrice: 120.00,
        currency: 'USD',
        sla: { responseTime: 2, resolutionTime: 8 },
        riskLevel: 'high',
        tags: ['electricidad', 'mantenimiento', 'tableros', 'inspeccion']
      },
      {
        name: 'Reparación de Circuitos',
        code: 'ELEC-REPA-001',
        description: 'Diagnóstico y reparación de fallas en circuitos eléctricos',
        category: mantenimientoElectrico._id,
        billingUnit: 'hora',
        estimatedDuration: 3,
        basePrice: 65.00,
        currency: 'USD',
        sla: { responseTime: 1, resolutionTime: 4 },
        riskLevel: 'high',
        tags: ['electricidad', 'reparacion', 'circuitos', 'diagnostico']
      }
    ]);

    // Servicios de Plomería
    await Service.create([
      {
        name: 'Instalación de Lavamanos',
        code: 'PLOM-LAVA-001',
        description: 'Instalación completa de lavamanos incluyendo grifería y conexiones',
        category: plomeriaCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 3,
        basePrice: 85.00,
        currency: 'USD',
        sla: { responseTime: 4, resolutionTime: 8 },
        riskLevel: 'medium',
        tags: ['plomeria', 'instalacion', 'lavamanos', 'griferia']
      },
      {
        name: 'Reparación de Tuberías',
        code: 'PLOM-TUBE-001',
        description: 'Reparación de fugas y reemplazo de secciones de tubería',
        category: plomeriaCategory._id,
        billingUnit: 'metro',
        estimatedDuration: 4,
        basePrice: 25.00,
        currency: 'USD',
        sla: { responseTime: 2, resolutionTime: 6 },
        riskLevel: 'medium',
        tags: ['plomeria', 'reparacion', 'tuberias', 'fugas']
      },
      {
        name: 'Destapado de Drenajes',
        code: 'PLOM-DREN-001',
        description: 'Destapado profesional de drenajes y sistemas de desagüe',
        category: plomeriaCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 2,
        basePrice: 55.00,
        currency: 'USD',
        sla: { responseTime: 1, resolutionTime: 4 },
        riskLevel: 'low',
        tags: ['plomeria', 'destapado', 'drenajes', 'desague']
      }
    ]);

    // Servicios de HVAC
    await Service.create([
      {
        name: 'Mantenimiento de Aires Acondicionados',
        code: 'HVAC-MANT-001',
        description: 'Mantenimiento preventivo de sistemas de aire acondicionado, limpieza y revisión',
        category: hvacCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 2,
        basePrice: 75.00,
        currency: 'USD',
        sla: { responseTime: 4, resolutionTime: 8 },
        riskLevel: 'medium',
        tags: ['hvac', 'mantenimiento', 'aire_acondicionado', 'preventivo']
      },
      {
        name: 'Instalación de Sistemas de Ventilación',
        code: 'HVAC-VENT-001',
        description: 'Instalación de sistemas de ventilación industrial y comercial',
        category: hvacCategory._id,
        billingUnit: 'proyecto',
        estimatedDuration: 16,
        basePrice: 850.00,
        currency: 'USD',
        sla: { responseTime: 8, resolutionTime: 48 },
        riskLevel: 'high',
        tags: ['hvac', 'instalacion', 'ventilacion', 'industrial']
      },
      {
        name: 'Reparación de Compresores',
        code: 'HVAC-COMP-001',
        description: 'Diagnóstico y reparación de compresores de refrigeración',
        category: hvacCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 6,
        basePrice: 180.00,
        currency: 'USD',
        sla: { responseTime: 4, resolutionTime: 12 },
        riskLevel: 'high',
        tags: ['hvac', 'reparacion', 'compresores', 'refrigeracion']
      }
    ]);

    // Servicios de Mantenimiento General
    await Service.create([
      {
        name: 'Pintura de Paredes Interiores',
        code: 'MANT-PINT-001',
        description: 'Servicio de pintura profesional para paredes interiores',
        category: mantenimientoCategory._id,
        billingUnit: 'metro cuadrado',
        estimatedDuration: 8,
        basePrice: 8.50,
        currency: 'USD',
        sla: { responseTime: 8, resolutionTime: 24 },
        riskLevel: 'low',
        tags: ['mantenimiento', 'pintura', 'paredes', 'interior']
      },
      {
        name: 'Reparación de Cerraduras',
        code: 'MANT-CERR-001',
        description: 'Reparación e instalación de cerraduras de seguridad',
        category: mantenimientoCategory._id,
        billingUnit: 'unidad',
        estimatedDuration: 1,
        basePrice: 40.00,
        currency: 'USD',
        sla: { responseTime: 2, resolutionTime: 4 },
        riskLevel: 'low',
        tags: ['mantenimiento', 'cerraduras', 'seguridad']
      },
      {
        name: 'Mantenimiento de Jardines',
        code: 'MANT-JARD-001',
        description: 'Poda, limpieza y mantenimiento de áreas verdes',
        category: mantenimientoCategory._id,
        billingUnit: 'metro cuadrado',
        estimatedDuration: 4,
        basePrice: 3.50,
        currency: 'USD',
        sla: { responseTime: 12, resolutionTime: 24 },
        riskLevel: 'low',
        tags: ['mantenimiento', 'jardines', 'poda', 'areas_verdes']
      }
    ]);

    // Servicios de Limpieza
    await Service.create([
      {
        name: 'Limpieza Profunda de Oficinas',
        code: 'LIMP-OFIC-001',
        description: 'Servicio de limpieza profunda para espacios de oficina',
        category: limpiezaCategory._id,
        billingUnit: 'metro cuadrado',
        estimatedDuration: 6,
        basePrice: 4.25,
        currency: 'USD',
        sla: { responseTime: 8, resolutionTime: 16 },
        riskLevel: 'low',
        tags: ['limpieza', 'oficinas', 'profunda', 'comercial']
      },
      {
        name: 'Desinfección por COVID-19',
        code: 'LIMP-COVI-001',
        description: 'Desinfección especializada contra COVID-19 con productos certificados',
        category: limpiezaCategory._id,
        billingUnit: 'metro cuadrado',
        estimatedDuration: 4,
        basePrice: 6.75,
        currency: 'USD',
        sla: { responseTime: 4, resolutionTime: 8 },
        riskLevel: 'medium',
        tags: ['limpieza', 'desinfeccion', 'covid19', 'sanitizacion']
      },
      {
        name: 'Limpieza de Vidrios y Ventanas',
        code: 'LIMP-VIDR-001',
        description: 'Limpieza profesional de vidrios, ventanas y superficies transparentes',
        category: limpiezaCategory._id,
        billingUnit: 'metro cuadrado',
        estimatedDuration: 2,
        basePrice: 5.50,
        currency: 'USD',
        sla: { responseTime: 8, resolutionTime: 16 },
        riskLevel: 'medium',
        tags: ['limpieza', 'vidrios', 'ventanas', 'transparentes']
      }
    ]);

    console.log('✅ Services created');

    // ===============================
    // 📊 ESTADÍSTICAS FINALES
    // ===============================
    
    const totalCategories = await ServiceCategory.countDocuments();
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ isActive: true });
    
    console.log('\n🎉 Mercado Digital seed completed successfully!');
    console.log(`📈 Statistics:`);
    console.log(`   📁 Categories: ${totalCategories}`);
    console.log(`   ⚙️  Services: ${totalServices}`);
    console.log(`   ✅ Active Services: ${activeServices}`);
    console.log(`   💰 Average Price: $${(await Service.aggregate([{$group: {_id: null, avg: {$avg: '$basePrice'}}}]))[0]?.avg?.toFixed(2) || '0.00'}`);
    
    // Mostrar categorías creadas
    console.log(`\n📋 Categories created:`);
    const categories = await ServiceCategory.find().sort({ order: 1 });
    for (const cat of categories) {
      const serviceCount = await Service.countDocuments({ category: cat._id });
      console.log(`   ${cat.parentCategory ? '  └─' : '├─'} ${cat.name} (${cat.code}) - ${serviceCount} services`);
    }

  } catch (error) {
    console.error('❌ Error seeding marketplace:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Ejecutar el seed
seedMarketplace();