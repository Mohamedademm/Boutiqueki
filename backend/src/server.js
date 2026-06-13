require('dotenv').config();
const { config, db } = require('./utils');

// Valider les variables d'environnement au démarrage
config.validateEnv();

const app = require('./app');
const { port } = config.getConfig();

async function startServer() {
  // Tester la connexion DB avant de démarrer
  const connected = await db.testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Exiting.');
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`🚀 Boutiki API running on port ${port}`);
    console.log(`   Mode: ${process.env.NODE_ENV}`);
  });
}

startServer();
