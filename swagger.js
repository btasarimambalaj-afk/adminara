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
  apis: ['./routes/*.js', './server.js']
};

module.exports = swaggerJsdoc(options);
