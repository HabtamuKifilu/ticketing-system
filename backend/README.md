# Ticketing System Backend

A secure, scalable Node.js/Express API for a role-based ticketing system, built with MongoDB.

## Features
- **JWT Authentication**: Secure login/signup with token expiration.
- **Role-Based Access**: Users create/view their tickets; Admins manage all tickets.
- **Validation**: Input sanitization and validation with `express-validator`.
- **Security**: Rate limiting, Helmet, restricted CORS.
- **Logging**: Activity and error logging with Winston.
- **Scalability**: Centralized config, MongoDB connection pooling.

## Setup
1. **Install Dependencies**:
   ```bash
   npm install
   npm install --save-dev nodemon  # Optional for dev