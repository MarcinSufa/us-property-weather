import { createServer } from 'node:http';
import pino from 'pino';
import { ConfigError, loadConfig, type Config } from './config.ts';
import { openDatabase } from './db/database.ts';
import { createPropertyYoga } from './graphql/yoga.ts';
import { PropertyRepository } from './property/property-repository.ts';
import { PropertyService } from './property/property-service.ts';
import { WeatherstackProvider } from './weather/weatherstack-provider.ts';

let config: Config | undefined;
try {
  config = loadConfig(process.env);
} catch (error) {
  if (error instanceof ConfigError) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}

if (config !== undefined) {
  const logger = pino({ level: config.logLevel });
  const database = openDatabase(config.databasePath);
  const weatherProvider = new WeatherstackProvider({
    fetch,
    baseUrl: config.weatherstackBaseUrl,
    apiKey: config.weatherstackApiKey,
    timeoutMs: config.weatherTimeoutMs,
    logger,
  });
  const repository = new PropertyRepository(database);
  const propertyService = new PropertyService({ repository, weatherProvider });
  const yoga = createPropertyYoga({ propertyService, logger });
  const server = createServer((request, response) => {
    void yoga(request, response);
  });
  let databaseClosed = false;
  let shutdownStarted = false;
  let serverFailed = false;

  function closeDatabase(): void {
    if (!databaseClosed) {
      database.close();
      databaseClosed = true;
    }
  }

  function shutdown(): void {
    if (shutdownStarted) {
      return;
    }
    shutdownStarted = true;
    server.close(() => {
      closeDatabase();
      logger.info('GraphQL server stopped');
      if (!serverFailed) {
        process.exitCode = 0;
      }
    });
    server.closeIdleConnections();
  }

  server.on('error', (error) => {
    if (!serverFailed) {
      serverFailed = true;
      logger.error({ err: error }, 'HTTP server error');
      closeDatabase();
      process.exitCode = 1;
      if (server.listening) {
        server.close();
        server.closeAllConnections();
      }
    }
  });

  server.listen(config.port, () => {
    logger.info({ port: config.port }, 'GraphQL server listening');
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
