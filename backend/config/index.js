module.exports = {
    mongoOptions: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if MongoDB unreachable
      maxPoolSize: 10, // Connection pool for scalability
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    },
    port: process.env.PORT || 5000,
    cors: {
      origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://your-production-url.com', // Adjust for prod
      methods: ['GET', 'POST', 'PUT'],
      allowedHeaders: ['Content-Type', 'x-auth-token'],
    },
  };