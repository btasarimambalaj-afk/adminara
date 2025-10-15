const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AdminAra WebRTC API',
      version: '1.3.8',
      description: 'WebRTC video support system API documentation',
      contact: {
        name: 'AdminAra Support',
        url: 'https://adminara.onrender.com'
      }
    },
    servers: [
      {
        url: 'https://adminara.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    externalDocs: {
      description: 'Socket.IO API Documentation',
      url: 'https://github.com/btasarimambalaj-afk/adminara/blob/main/SOCKET-API.md'
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'WebRTC', description: 'WebRTC configuration' },
      { name: 'Admin', description: 'Admin authentication' },
      { name: 'Monitoring', description: 'Metrics and monitoring' }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'adminSession'
        },
        metricsAuth: {
          type: 'http',
          scheme: 'basic'
        }
      }
    }
  },
  apis: ['./routes/*.js', './routes/**/*.js', './server.js']
};

module.exports = swaggerJsdoc(options);
