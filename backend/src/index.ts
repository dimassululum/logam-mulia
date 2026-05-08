import { createApp, setupGracefulShutdown } from './core/server';
import { env } from './core/config/env';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

async function startServer() {
  try {
    console.log('🔧 Starting Logam Mulia Backend Server...');
    
    // Test database connection
    console.log('📡 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Create Express app
    const app = createApp();

    // Setup graceful shutdown
    setupGracefulShutdown(app);

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server is running on port ${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${env.PORT}/health`);
      console.log(`📡 API endpoint: http://localhost:${env.PORT}/api`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof env.PORT === 'string' 
        ? 'Pipe ' + env.PORT 
        : 'Port ' + env.PORT;

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Update graceful shutdown to handle database
    const originalGracefulShutdown = setupGracefulShutdown;
    setupGracefulShutdown = (app: any) => {
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
        
        try {
          // Close server
          server.close(async () => {
            console.log('🔌 HTTP server closed');
            
            // Close database connection
            await prisma.$disconnect();
            console.log('📡 Database disconnected');
            
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
          });
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    };
    
    setupGracefulShutdown(app);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();