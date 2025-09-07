/**
 * Script para limpiar todas las colecciones de la base de datos
 * Para ejecutar: node scripts/cleanup-database.js
 * 
 * ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos
 */

const mongoose = require('mongoose');
const readline = require('readline');

// Configuración de la base de datos
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safety-app';

// Lista de colecciones a limpiar
const COLLECTIONS_TO_CLEAN = [
  'companies',
  'users',
  'contractors', 
  'workpermits',
  'activities',
  'alerts',
  'notifications',
  'courses',
  'certifications',
  'reports',
  'settings',
  'logs'
];

// Interfaz para confirmación del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function confirmAction() {
  console.log('🚨 ADVERTENCIA: Esta acción eliminará TODOS los datos de la base de datos');
  console.log(`📊 Base de datos: ${MONGODB_URI}`);
  console.log(`🗑️  Colecciones a limpiar: ${COLLECTIONS_TO_CLEAN.join(', ')}`);
  console.log('');
  
  const answer1 = await askQuestion('¿Estás seguro de que quieres continuar? (yes/no): ');
  
  if (answer1.toLowerCase() !== 'yes') {
    console.log('❌ Operación cancelada');
    return false;
  }
  
  const answer2 = await askQuestion('Esta acción NO se puede deshacer. Escribe "DELETE ALL DATA" para confirmar: ');
  
  if (answer2 !== 'DELETE ALL DATA') {
    console.log('❌ Confirmación incorrecta. Operación cancelada');
    return false;
  }
  
  return true;
}

async function cleanupDatabase() {
  try {
    console.log('🧹 Iniciando limpieza de la base de datos...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    
    // Obtener todas las colecciones existentes
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);
    
    console.log(`📋 Colecciones encontradas: ${existingCollections.join(', ')}`);
    
    let cleanedCount = 0;
    let totalDocuments = 0;
    
    // Limpiar cada colección
    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      if (existingCollections.includes(collectionName)) {
        const collection = db.collection(collectionName);
        
        // Contar documentos antes de eliminar
        const count = await collection.countDocuments();
        totalDocuments += count;
        
        if (count > 0) {
          // Eliminar todos los documentos
          const result = await collection.deleteMany({});
          console.log(`🗑️  ${collectionName}: ${result.deletedCount} documentos eliminados`);
          cleanedCount++;
        } else {
          console.log(`⚪ ${collectionName}: ya estaba vacía`);
        }
      } else {
        console.log(`⚠️  ${collectionName}: colección no encontrada`);
      }
    }
    
    // Limpiar índices (opcional)
    console.log('\n🔧 Limpiando índices...');
    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      if (existingCollections.includes(collectionName)) {
        try {
          const collection = db.collection(collectionName);
          await collection.dropIndexes();
          console.log(`🔧 ${collectionName}: índices eliminados`);
        } catch (error) {
          // Ignorar errores de índices (pueden no existir)
          console.log(`⚠️  ${collectionName}: no se pudieron eliminar los índices`);
        }
      }
    }
    
    console.log('\n✅ Limpieza completada exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${cleanedCount} colecciones limpiadas`);
    console.log(`   - ${totalDocuments} documentos eliminados en total`);
    console.log(`   - Base de datos lista para nuevos datos`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
    rl.close();
    process.exit(0);
  }
}

// Función alternativa para limpieza rápida (sin confirmación)
async function quickCleanup() {
  try {
    console.log('🧹 Limpieza rápida iniciada...');
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);
    
    let totalDeleted = 0;
    
    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      if (existingCollections.includes(collectionName)) {
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        totalDeleted += result.deletedCount;
        console.log(`✅ ${collectionName}: ${result.deletedCount} eliminados`);
      }
    }
    
    console.log(`🎉 Total eliminados: ${totalDeleted} documentos`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Función para limpiar solo una colección específica
async function cleanSpecificCollection(collectionName) {
  try {
    console.log(`🧹 Limpiando colección: ${collectionName}`);
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    
    if (count === 0) {
      console.log(`⚪ La colección ${collectionName} ya está vacía`);
      return;
    }
    
    const result = await collection.deleteMany({});
    console.log(`✅ ${collectionName}: ${result.deletedCount} documentos eliminados`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Función para reset completo (eliminar colecciones completamente)
async function fullReset() {
  const confirmed = await confirmAction();
  if (!confirmed) return;
  
  try {
    console.log('💣 Reset completo iniciado...');
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);
    
    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      if (existingCollections.includes(collectionName)) {
        await db.collection(collectionName).drop();
        console.log(`💥 ${collectionName}: colección eliminada completamente`);
      }
    }
    
    console.log('🎉 Reset completo finalizado');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  }
}

// Procesar argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    await quickCleanup();
  } else if (args.includes('--collection') || args.includes('-c')) {
    const collectionIndex = args.findIndex(arg => arg === '--collection' || arg === '-c');
    const collectionName = args[collectionIndex + 1];
    
    if (!collectionName) {
      console.log('❌ Error: Especifica el nombre de la colección');
      console.log('Uso: node cleanup-database.js --collection <nombre>');
      process.exit(1);
    }
    
    await cleanSpecificCollection(collectionName);
  } else if (args.includes('--full-reset')) {
    await fullReset();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🧹 Safety App - Limpieza de Base de Datos');
    console.log('');
    console.log('Uso:');
    console.log('  node cleanup-database.js                 Limpieza interactiva (con confirmación)');
    console.log('  node cleanup-database.js --quick         Limpieza rápida (sin confirmación)');
    console.log('  node cleanup-database.js --collection <nombre>  Limpiar solo una colección');
    console.log('  node cleanup-database.js --full-reset    Reset completo (eliminar colecciones)');
    console.log('  node cleanup-database.js --help          Mostrar esta ayuda');
    console.log('');
    console.log('Colecciones disponibles:');
    COLLECTIONS_TO_CLEAN.forEach(col => console.log(`  - ${col}`));
    process.exit(0);
  } else {
    // Limpieza interactiva por defecto
    const confirmed = await confirmAction();
    if (confirmed) {
      await cleanupDatabase();
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = { 
  cleanupDatabase, 
  quickCleanup, 
  cleanSpecificCollection, 
  fullReset 
};