import http from 'http';
import app, { connectDatabase } from './app.js';

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  await connectDatabase();

  const server = http.createServer(app);

  server.listen(PORT, HOST, () => {
    console.log(`Backend server is running at http://${HOST}:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async (closeError) => {
      if (closeError) {
        console.error('Failed to close HTTP server:', closeError);
        process.exit(1);
      }

      try {
        process.exit(0);
      } catch (error) {
        console.error('Failed to close database connection:', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});