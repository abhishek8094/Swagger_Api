const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Authentication API',
      version: '1.0.0',
      description: 'A complete authentication API with MongoDB and JWT',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server'
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
    }
  },
  apis: ['./routes/*.js'] // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/carousel', require('./routes/carousel'));
app.use('/api/explore', require('./routes/explore'));
app.use('/api/trending', require('./routes/trending'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/addresses', require('./routes/address'));
app.use('/api/orders', require('./routes/order'));

// Serve static files for uploaded images
app.use('/uploads', express.static('public/uploads'));

// Swagger route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

const errorHandler = require('./middleware/errorHandler');

// Handle undefined routes
app.use('*', (req, res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

// For Vercel serverless functions, we don't need to listen on a port
// The app is exported and Vercel will handle the serverless function execution
console.log('Server configured for Vercel serverless deployment');

module.exports = app;
