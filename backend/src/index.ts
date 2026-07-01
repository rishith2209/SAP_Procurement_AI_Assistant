import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: '*', // Allow all origins for sandbox communication
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Logging morgan console outputs
app.use(morgan('dev'));

// Static files server for document uploads
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Rate Limiting for Authentication routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});
app.use('/api/v1/auth/login', loginLimiter);

// Expose OpenAPI interactive developer specifications
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount routes tree
app.use('/api/v1', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Centralized error handler middleware
app.use(errorHandler);

// Listen
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` S/4HANA Enterprise API Server is running locally`);
  console.log(` Port: ${PORT}`);
  console.log(` API URL: http://localhost:${PORT}/api/v1`);
  console.log(` Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(`=================================================`);
});
