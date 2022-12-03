'use strict';

import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import { Storage } from '@google-cloud/storage';
import * as dotenv from 'dotenv';
dotenv.config();

const fastify = Fastify({
  logger: true
});

const storage = new Storage(
  process.env.ENV === 'local'
    ? {
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY
      }
    : undefined
);

/**
 * Register CORS
 */
await fastify.register(cors, {
  origin: process.env.CORS_ORIGINS ?? '*'
});

/**
 * Register multipart
 */
fastify.register(fastifyMultipart);

/**
 * Register Swagger (OpenAPI schema)
 */
fastify.register(fastifySwagger, {
  mode: 'static',
  specification: {
    path: './schemas/openapi.yaml'
  }
});

/**
 * Register Swagger UI
 */
fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    deepLinking: true,
    filter: ''
  }
});

/**
 * Register API endpoints
 */
fastify.register(
  async (fastify) => {
    /**
     * GET status
     */
    fastify.get('/status', async () => {
      return { status: 'OK' };
    });

    /**
     * POST upload
     */
    fastify.post('/upload', async (request, reply) => {
      const data = await request.file();
      const file = storage.bucket(process.env.BUCKET).file(data.filename);
      await file.save(await data.toBuffer());
      const url = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // tomorrow
        responseType: data.contentType,
        responseDisposition: 'attachment; filename=' + data.filename
      });
      reply.send({ url });
    });

    /**
     * GET download
     */
    fastify.get('/download/:filename', async (request, reply) => {
      const { filename } = request.params;
      const file = storage.bucket(process.env.BUCKET).file(filename);

      // https://github.com/googleapis/google-cloud-node/issues/2556
      const exists = (await file.exists())[0];

      if (!exists) {
        reply.code(404).send({ message: 'File not found' });
        return;
      }

      const contents = (await file.download())[0];
      reply.header('Content-Disposition', 'attachment; filename=' + filename);
      reply.header('Content-Type', 'application/octet-stream');
      reply.send(contents);
    });
  },
  { prefix: '/api' }
);

/**
 * Run the server!
 */
await fastify.ready();
const start = async () => {
  try {
    fastify.listen({
      host: process.env.HOST ?? '0.0.0.0',
      port: process.env.PORT ?? 3000
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
