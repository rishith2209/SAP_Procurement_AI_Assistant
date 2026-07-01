import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SAP Procurement AI Assistant API Catalog',
      version: '1.0.0',
      description: 'Enterprise REST APIs connected to S/4HANA ERP instance, exposing transaction logs, document indexing structures, and RAG co-pilot messaging endpoints.'
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'V1 ERP local backend'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/index.js', './src/routes/*.ts', './src/index.ts']
};

export const swaggerSpec = swaggerJSDoc(options);
